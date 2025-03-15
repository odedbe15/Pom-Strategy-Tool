from flask import Flask, render_template, request
import requests
import json
app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)
api_key = "IKlyYKT9GPkEkTlKkYKiPUszdH0rHJYGNIs1i4gtmjFjauRmeOP7g8X7ETndSUlG"
event_key = "2025isde4"
team_key = "frc1690"
print("DAT Running")

def get_team_matches(team_key, api_key, event_key):
    url = f"https://www.thebluealliance.com/api/v3/team/{team_key}/event/{event_key}/matches"
    print(url)
    headers = {"X-TBA-Auth-Key": api_key, "accept": "application/json"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error in get_team_matches: {e}")
        return None

@app.route('/', methods=['GET', 'POST'])
def home():
    matches = get_team_matches(team_key, api_key, event_key)
    if matches:
        matches.sort(key=lambda x: x['match_number'])
        for match in matches:
            if 'score_breakdown' not in match or match['score_breakdown'] is None:
                match['score_breakdown'] = {'red':{'rp':None},'blue':{'rp':None}}
        return render_template('home.html', matches=matches)
    else:
        return render_template("dd.html")
    
    
@app.route("/analytics", methods=['GET','POST'])
def analytics():
    if request.method == "GET":
        return render_template("analytics.html")
    
    else:
        notes = request.form['txt']
        match = request.form['match']
        data = {"Match" : match, "Notes":notes}
        filename = "Match " + match +".json"
        print(data)
        try:
            with open(filename, 'w') as f:
                json.dump(data,f, indent=4)
        except Exception as e:
            print(f"Error Saving to {filename}: {e}")
        return render_template("analytics.html")
        
    
    
@app.route("/nscout")
def nscout():
    return render_template("dd.html")


@app.route("/alliance")
def alliance():
    return render_template("n1.html")

if __name__ == "__main__":
    app.run(debug=True)