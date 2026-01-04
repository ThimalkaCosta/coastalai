import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import datetime

def prepare_features(df):
    """
    Converts Date to ordinal for regression.
    """
    if 'Date' in df.columns:
        df = df.sort_values('Date')
        # Use days since first observation as feature to keep numbers small
        base_date = df['Date'].min()
        df['Days'] = (df['Date'] - base_date).dt.days
        return df, base_date
    return df, None

def train_and_predict(df, transect_cols, years_ahead=5):
    """
    Trains a Random Forest for each transect and forecasts future position.
    """
    df_processed, base_date = prepare_features(df)
    
    # Define future target dates
    last_date = df_processed['Date'].max()
    future_dates = []
    # Forecast annually for 5 years
    for i in range(1, years_ahead + 1):
        future_dates.append(last_date + datetime.timedelta(days=365 * i))
    
    future_days = [(d - base_date).days for d in future_dates]
    X_future = np.array(future_days).reshape(-1, 1)
    
    X = df_processed[['Days']].values
    
    predictions = {}
    models = {}
    
    print(f"Training models for {len(transect_cols)} transects...")
    
    for col in transect_cols:
        y = df_processed[col].values
        # Drop NaNs if any
        mask = ~np.isnan(y)
        if np.sum(mask) < 2:
            predictions[col] = [np.nan] * len(future_dates)
            continue
            
        # Linear Regression for trend extrapolation
        # RF cannot extrapolate beyond training range
        model = LinearRegression()
        model.fit(X[mask], y[mask])
        
        # Predict
        preds = model.predict(X_future)
        predictions[col] = preds
        models[col] = model
        
    # Construct result DataFrame
    future_df = pd.DataFrame({'Date': future_dates})
    for col, preds in predictions.items():
        future_df[col] = preds
        
    return future_df, models

if __name__ == "__main__":
    pass
