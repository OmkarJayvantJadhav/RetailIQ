"""
RetailIQ - Customer Analytics Engine
Performs RFM scoring, CLV calculation, and churn prediction.
"""
import pandas as pd
import numpy as np
import os

DATA_DIR = '../data/raw'
RESULTS_DIR = '../ml/results'

os.makedirs(RESULTS_DIR, exist_ok=True)

def perform_rfm_analysis():
    print("Performing RFM Analysis...")
    orders = pd.read_csv(f'{DATA_DIR}/orders.csv')
    orders['order_date'] = pd.to_datetime(orders['order_date'])
    
    # Snapshot date is 1 day after the last order
    snapshot_date = orders['order_date'].max() + pd.Timedelta(days=1)
    
    # Calculate R, F, M
    rfm = orders.groupby('customer_id').agg({
        'order_date': lambda x: (snapshot_date - x.max()).days,
        'order_id': 'count',
        'total_amount': 'sum'
    }).reset_index()
    
    rfm.rename(columns={
        'order_date': 'Recency',
        'order_id': 'Frequency',
        'total_amount': 'Monetary'
    }, inplace=True)
    
    # Scoring 1-5 (5 is best)
    # Recency: lower is better
    rfm['R_Score'] = pd.qcut(rfm['Recency'], 5, labels=[5, 4, 3, 2, 1])
    # Frequency: higher is better
    # Handle duplicate edges by using rank
    freq_rank = rfm['Frequency'].rank(method='first')
    rfm['F_Score'] = pd.qcut(freq_rank, 5, labels=[1, 2, 3, 4, 5])
    # Monetary: higher is better
    rfm['M_Score'] = pd.qcut(rfm['Monetary'], 5, labels=[1, 2, 3, 4, 5])
    
    # Combine scores
    rfm['RFM_Segment'] = rfm['R_Score'].astype(str) + rfm['F_Score'].astype(str) + rfm['M_Score'].astype(str)
    rfm['RFM_Score'] = rfm[['R_Score', 'F_Score', 'M_Score']].sum(axis=1)
    
    # Segmentation
    def segment_customer(df):
        if df['RFM_Score'] >= 14:
            return 'Champions'
        elif df['RFM_Score'] >= 11:
            return 'Loyal Customers'
        elif df['RFM_Score'] >= 8:
            return 'Potential Loyalist'
        elif df['RFM_Score'] >= 6:
            return 'Needs Attention'
        elif df['R_Score'] <= 2 and df['F_Score'] >= 3:
            return 'At Risk'
        else:
            return 'Lost'
            
    rfm['Customer_Segment'] = rfm.apply(segment_customer, axis=1)
    
    # Calculate basic CLV (simplified: average order value * purchase frequency)
    # Assumes 1 year lifespan for simplicity
    aov = rfm['Monetary'] / rfm['Frequency']
    rfm['CLV_Estimated'] = aov * rfm['Frequency'] * 1.5 # 1.5 multiplier as a baseline
    
    rfm.to_csv(f'{RESULTS_DIR}/customer_segments.csv', index=False)
    
    print("\nSegment Distribution:")
    print(rfm['Customer_Segment'].value_counts())
    print(f"\nRFM results saved to {RESULTS_DIR}/customer_segments.csv")

if __name__ == "__main__":
    perform_rfm_analysis()
