import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import os

def evaluate_model():
    print("--- Model Evaluation (Hindcasting) ---")
    
    # Load processed data (distances)
    input_path = r"e:\coastal\output\processed_data_full.csv"
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Run main.py first.")
        return
        
    df = pd.read_csv(input_path)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')
    
    # Define Split
    # Let's use the last 20% of dates as the Test Set
    dates = df['Date'].unique()
    split_idx = int(len(dates) * 0.8)
    split_date = dates[split_idx]
    
    print(f"Total Dates: {len(dates)}")
    print(f"Splitting data at: {split_date}")
    
    train_df = df[df['Date'] < split_date].copy()
    test_df = df[df['Date'] >= split_date].copy()
    
    print(f"Train Set: {len(train_df)} rows")
    print(f"Test Set: {len(test_df)} rows")
    
    # Prepare transects
    transect_cols = [c for c in df.columns if c.startswith('Transect_')]
    
    # Metrics storage
    all_y_true = []
    all_y_pred = []
    
    transect_metrics = []
    
    # Train & Predict for each transect
    for col in transect_cols:
        # Prepare X (Days since start)
        base_date = train_df['Date'].min()
        
        y_train = train_df[col].values
        X_train = (train_df['Date'] - base_date).dt.days.values.reshape(-1, 1)
        
        y_test = test_df[col].values
        X_test = (test_df['Date'] - base_date).dt.days.values.reshape(-1, 1)
        
        # Clean NaNs
        mask_train = ~np.isnan(y_train)
        mask_test = ~np.isnan(y_test)
        
        if np.sum(mask_train) < 2 or np.sum(mask_test) < 1:
            continue
            
        # Model
        model = LinearRegression()
        model.fit(X_train[mask_train], y_train[mask_train])
        
        # Predict on Test
        preds = model.predict(X_test[mask_test])
        actuals = y_test[mask_test]
        
        all_y_true.extend(actuals)
        all_y_pred.extend(preds)
        
        # Per transect metric
        rmse = np.sqrt(mean_squared_error(actuals, preds))
        mae = mean_absolute_error(actuals, preds)
        
        transect_metrics.append({
            'Transect': col,
            'RMSE_deg': rmse,
            'MAE_deg': mae,
            'RMSE_m': rmse * 111000, # Approx meters
            'MAE_m': mae * 111000
        })
        
    # Global Metrics
    global_rmse_deg = np.sqrt(mean_squared_error(all_y_true, all_y_pred))
    global_mae_deg = mean_absolute_error(all_y_true, all_y_pred)
    global_r2 = r2_score(all_y_true, all_y_pred)
    
    # Calculate Percentage Accuracy (Proxy)
    # Mean Accuracy = 100% - Mean(Abs(Actual - Pred) / Actual) * 100
    # Avoid div by zero
    y_true_arr = np.array(all_y_true)
    y_pred_arr = np.array(all_y_pred)
    
    # Filter out near-zero actuals to avoid infinite error
    valid_mask = np.abs(y_true_arr) > 1e-5
    
    if np.sum(valid_mask) > 0:
        mape = np.mean(np.abs((y_true_arr[valid_mask] - y_pred_arr[valid_mask]) / y_true_arr[valid_mask])) * 100
        accuracy_percentage = max(0, 100 - mape)
    else:
        accuracy_percentage = 0
    
    # Convert to Meters (Approximation)
    METERS_PER_DEG = 111000
    global_rmse_m = global_rmse_deg * METERS_PER_DEG
    global_mae_m = global_mae_deg * METERS_PER_DEG
    
    print("\n--- Overall Performance Metrics ---")
    print(f"Model Accuracy:                 {accuracy_percentage:.2f}%")
    print(f"R-Squared (R²) Score:           {global_r2:.4f}")
    print(f"RMSE (Root Mean Squared Error): {global_rmse_m:.2f} meters")
    print(f"MAE (Mean Absolute Error):      {global_mae_m:.2f} meters")
    
    with open(r"e:\coastal\output\global_metrics.txt", "w") as f:
        f.write(f"Accuracy: {accuracy_percentage:.2f}%\n")
        f.write(f"R2: {global_r2:.4f}\n")
        f.write(f"RMSE: {global_rmse_m:.2f} meters\n")
        f.write(f"MAE: {global_mae_m:.2f} meters\n")
    
    # Save Report
    metrics_df = pd.DataFrame(transect_metrics)
    out_file = r"e:\coastal\output\model_accuracy_report.csv"
    metrics_df.to_csv(out_file, index=False)
    print(f"\nDetailed metrics per transect saved to: {out_file}")

if __name__ == "__main__":
    try:
        evaluate_model()
    except Exception as e:
        import traceback
        traceback.print_exc()
