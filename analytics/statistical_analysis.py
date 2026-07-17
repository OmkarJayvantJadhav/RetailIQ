"""
RetailIQ - Statistical Analysis Engine
Performs correlations, t-tests, ANOVA, and outlier detection.
"""
import pandas as pd
import numpy as np
from scipy import stats
import os

DATA_DIR = '../data/raw'
RESULTS_DIR = '../ml/results'

os.makedirs(RESULTS_DIR, exist_ok=True)

def perform_statistical_analysis():
    print("Performing Statistical Analysis...")
    orders = pd.read_csv(f'{DATA_DIR}/orders.csv')
    customers = pd.read_csv(f'{DATA_DIR}/customers.csv')
    
    # Merge orders with customers
    df = pd.merge(orders, customers, on='customer_id')
    
    results = []
    
    # 1. Independent t-test (Male vs Female AOV)
    male_orders = df[df['gender'] == 'Male']['total_amount']
    female_orders = df[df['gender'] == 'Female']['total_amount']
    
    t_stat, p_val_t = stats.ttest_ind(male_orders, female_orders, equal_var=False)
    results.append({
        'Test': 'Independent t-test (Gender vs Order Amount)',
        'Statistic': round(t_stat, 4),
        'p-value': round(p_val_t, 4),
        'Significant (p<0.05)': p_val_t < 0.05
    })
    
    # 2. ANOVA (Income Level vs Order Amount)
    income_groups = [group['total_amount'].values for name, group in df.groupby('income_level')]
    if len(income_groups) >= 2:
        f_stat, p_val_f = stats.f_oneway(*income_groups)
        results.append({
            'Test': 'ANOVA (Income Level vs Order Amount)',
            'Statistic': round(f_stat, 4),
            'p-value': round(p_val_f, 4),
            'Significant (p<0.05)': p_val_f < 0.05
        })
        
    # 3. Correlation (Age vs Order Amount) - Pearson
    pearson_corr, p_val_p = stats.pearsonr(df['age'], df['total_amount'])
    results.append({
        'Test': 'Pearson Correlation (Age vs Order Amount)',
        'Statistic': round(pearson_corr, 4),
        'p-value': round(p_val_p, 4),
        'Significant (p<0.05)': p_val_p < 0.05
    })
    
    # 4. Outlier Detection (Z-Score on Order Amounts)
    z_scores = np.abs(stats.zscore(df['total_amount']))
    df['is_outlier'] = z_scores > 3
    num_outliers = df['is_outlier'].sum()
    
    print("\nStatistical Test Results:")
    stats_df = pd.DataFrame(results)
    print(stats_df.to_string(index=False))
    
    print(f"\nDetected {num_outliers} outlier orders (Z-Score > 3).")
    
    stats_df.to_csv(f'{RESULTS_DIR}/statistical_tests.csv', index=False)
    df[df['is_outlier']].to_csv(f'{RESULTS_DIR}/order_outliers.csv', index=False)
    
    print(f"\nResults saved to {RESULTS_DIR}")

if __name__ == "__main__":
    perform_statistical_analysis()
