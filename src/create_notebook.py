import json
import os

def create_notebook():
    output_file = r"e:\coastal\Coastal_Erosion_Forecast.ipynb"
    src_dir = r"e:\coastal\src"
    
    # Define files to include and their section headers
    modules = [
        ("Dependencies & Setup", None, [
            "import pandas as pd",
            "import numpy as np",
            "import matplotlib.pyplot as plt",
            "import os",
            "import xml.etree.ElementTree as ET",
            "from sklearn.linear_model import LinearRegression",
            "from sklearn.ensemble import RandomForestRegressor",
            "from scipy.spatial.distance import cdist",
            "import datetime",
            "%matplotlib inline"
        ]),
        ("Data Loader (src/data_loader.py)", "data_loader.py", []),
        ("Preprocessing (src/preprocessing.py)", "preprocessing.py", []),
        ("Forecasting Engine (src/forecasting.py)", "forecasting.py", []),
        ("Visualization (src/visualization.py)", "visualization.py", []),
        ("Interactive Forecast Logic", "interactive_forecast.py", [])
    ]
    
    cells = []
    
    # Title Cell
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": ["# Coastal Erosion Forecasting System\n",
                   "This notebook contains the full pipeline for processing coastal data, training the forecasting model, and visualizing future shoreline changes."]
    })
    
    for title, filename, custom_code in modules:
        # Header
        cells.append({
            "cell_type": "markdown",
            "metadata": {},
            "source": [f"## {title}"]
        })
        
        code_lines = []
        if filename:
            path = os.path.join(src_dir, filename)
            if os.path.exists(path):
                with open(path, "r") as f:
                    # Filter out imports that we already did globally (optional, but cleaner to keep them)
                    # For simplicity, we just dump the content.
                    # Ideally, we should remove 'if __name__ == "__main__":' blocks or adjust them.
                    lines = f.readlines()
                    code_lines = [l for l in lines if not l.startswith("from data_loader import") and not l.startswith("from preprocessing import")] 
            else:
                code_lines = [f"# File {filename} not found"]
        else:
            code_lines = [l + "\n" for l in custom_code]
            
        cells.append({
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": code_lines
        })
        
    # How to run
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": ["## Run Forecast\n", "Execute the cell below to start the interactive forecast."]
    })
    
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [
            "# To run the interactive tool:\n",
            "if __name__ == \"__main__\":\n",
            "    interactive_main()"
        ]
    })

    notebook = {
        "cells": cells,
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3"
            },
            "language_info": {
                "codemirror_mode": {
                    "name": "ipython",
                    "version": 3
                },
                "file_extension": ".py",
                "mimetype": "text/x-python",
                "name": "python",
                "nbconvert_exporter": "python",
                "pygments_lexer": "ipython3",
                "version": "3.8.5"
            }
        },
        "nbformat": 4,
        "nbformat_minor": 4
    }
    
    with open(output_file, "w") as f:
        json.dump(notebook, f, indent=1)
        
    print(f"Notebook created: {output_file}")

if __name__ == "__main__":
    create_notebook()
