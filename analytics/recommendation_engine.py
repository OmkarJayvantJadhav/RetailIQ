"""
RetailIQ - Recommendation Engine
Generates actionable business insights based on analytics outputs.
"""
import pandas as pd
import os
import json

RESULTS_DIR = '../ml/results'
os.makedirs(RESULTS_DIR, exist_ok=True)

def generate_recommendations():
    print("Generating Business Recommendations...")
    recommendations = []
    
    # 1. Inventory Recommendations
    try:
        inv_df = pd.read_csv(f'{RESULTS_DIR}/inventory_analysis.csv')
        overstock = inv_df[inv_df['is_overstock']]
        stockout = inv_df[inv_df['stockout_risk'] & (inv_df['ABC_Class'] == 'A')]
        
        if not overstock.empty:
            recommendations.append({
                "category": "Inventory",
                "priority": "Medium",
                "insight": f"Detected {len(overstock)} overstocked items.",
                "action": "Consider discounting C-class overstock items to free up warehouse space."
            })
            
        if not stockout.empty:
            recommendations.append({
                "category": "Inventory",
                "priority": "High",
                "insight": f"Detected {len(stockout)} Class A items at risk of stockout.",
                "action": "Expedite reorders for high-value Class A items immediately to prevent lost revenue."
            })
    except FileNotFoundError:
        print("Inventory analysis not found. Run inventory_analytics.py first.")
        
    # 2. Market Recommendations
    try:
        market_df = pd.read_csv(f'{RESULTS_DIR}/state_performance.csv')
        market_df = market_df.sort_values(by='total_revenue', ascending=False)
        top_state = market_df.iloc[0]
        bottom_state = market_df.iloc[-1]
        
        recommendations.append({
            "category": "Market Expansion",
            "priority": "High",
            "insight": f"State {top_state['state']} is the top performer with ${top_state['total_revenue']:,.2f} revenue.",
            "action": f"Allocate 20% more marketing budget to {top_state['state']} to capitalize on high demand."
        })
        recommendations.append({
            "category": "Market Expansion",
            "priority": "Low",
            "insight": f"State {bottom_state['state']} is underperforming relative to population.",
            "action": f"Investigate logistical or pricing barriers in {bottom_state['state']}."
        })
    except FileNotFoundError:
        print("Market analysis not found. Run market_analytics.py first.")

    # 3. Customer Recommendations
    try:
        cust_df = pd.read_csv(f'{RESULTS_DIR}/customer_segments.csv')
        at_risk = cust_df[cust_df['Customer_Segment'] == 'At Risk']
        
        if not at_risk.empty:
            recommendations.append({
                "category": "Customer Retention",
                "priority": "High",
                "insight": f"Identified {len(at_risk)} 'At Risk' customers with previously high purchase frequency.",
                "action": "Launch a targeted re-engagement email campaign offering a 15% discount for their next purchase."
            })
    except FileNotFoundError:
        print("Customer segments not found. Run customer_analytics.py first.")

    print("\nGenerated Recommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. [{rec['priority']}] {rec['category']}")
        print(f"   Insight: {rec['insight']}")
        print(f"   Action:  {rec['action']}")
        
    with open(f'{RESULTS_DIR}/recommendations.json', 'w') as f:
        json.dump(recommendations, f, indent=4)
        
    print(f"\nRecommendations saved to {RESULTS_DIR}/recommendations.json")

if __name__ == "__main__":
    generate_recommendations()
