
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

# Read the CSV file
df = pd.read_csv('data/num_hours/stats/num_hours_stats.csv')

df['Rows'] = df['Rows'].astype(int)

plt.figure(figsize=(10, 6))
translator = {"num_hours Encryption" : "Decimal Encrypted","num_hours" : "Decimal"}
colors = {'num_hours Encryption': 'blue', 'num_hours': 'green'}
markers = {'num_hours Encryption': 'o', 'num_hours': 's'}

for table_name in df['Table'].unique():
    subset = df[df['Table'] == table_name]
    x = subset['Rows']
    y = subset['Mean_Time']

    # Scatter plot
    plt.scatter(x, y, label=f'{translator[table_name]} Data', color=colors[table_name], marker=markers[table_name])

    # Simple Linear Regression (y = mx + b)
    slope, intercept = np.polyfit(x, y, 1)
    line = slope * x + intercept

    # Plot the regression line
    plt.plot(x, line, label=f'{translator[table_name]} Trendline ($y={slope:.4f}x + {intercept:.2f}$)',
             linestyle='--', color=colors[table_name])

plt.xlabel('Number of Rows')
plt.ylabel('Mean Execution Time (ms)')
plt.title('Execution Time vs. Number of Rows')
plt.legend()
plt.grid(True, linestyle=':', alpha=0.6)

# 6. Save and show
plt.savefig('data/num_hours/stats/execution_num_hours_time_plot.png')
plt.show()