import requests

url = "http://127.0.0.1:8000/api/upload"
file_path = "/Users/gavin/Downloads/stock visualizer/data/pnl-XJY521-03-03-25.xlsx"

try:
    with open(file_path, "rb") as f:
        response = requests.post(url, files={"file": f})
        
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success! Summary:")
        print(data['data']['summary'])
        print(f"Total Tickers parsed: {len(data['data']['tickers'])}")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Connection failed: {e}")
