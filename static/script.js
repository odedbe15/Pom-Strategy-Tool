// static/script.js
function loadTeams() {
    const teamData = prompt("Enter team data (num\\nname\\nlocation):");
    if (teamData) {
        fetch('/load_teams', {
            method: 'POST',
            body: new URLSearchParams({ team_data: teamData }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        });
    }
}

function loadMatches() {
    const matchData = prompt("Enter match data (Quals 1\\nteam1 team2 ...):");
    if (matchData) {
        fetch('/load_matches', {
            method: 'POST',
            body: new URLSearchParams({ match_data: matchData }),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            }
        });
    }
}

function setMatchNum() {
    const matchNum = document.getElementById('matchNum').value;
    fetch('/set_match_num', {
        method: 'POST',
        body: new URLSearchParams({ match_num: matchNum }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}

function showNotes() {
    window.location.href = '/notes';
}

function showAlliance() {
    window.location.href = '/alliance';
}

function showField() {
    window.location.href = '/field';
}

function returnToMain() {
    window.location.href = '/';
}

function addNote() {
    const teamNum = document.getElementById('teamSelect').value;
    const note = document.getElementById('noteInput').value;
    fetch('/notes', {
        method: 'POST',
        body: new URLSearchParams({ team_num: teamNum, note: note }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}

function deleteNote(teamNum, noteIndex) {
    fetch('/delete_note', {
        method: 'POST',
        body: new URLSearchParams({ team_num: teamNum, note_index: noteIndex }),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload();
        }
    });
}

function showTeamNotes(teamNum) {
    const notesArea = document.getElementById('teamNotesArea');
    const notes = {{ notes|tojson|safe }};
    const teams = {{ teams|tojson|safe }};
    if (notes[teamNum]) {
        let notesHtml = `<h3>${teamNum} - ${teams[teamNum].name} Notes</h3><ul>`;
        notes[teamNum].forEach((note, index) => {
            notesHtml += `<li><span class="math-inline">\{note\} <button onclick\="deleteNote\('</span>{teamNum}', ${index})">Delete</button></li>`;
        });
        notesHtml += `</ul>`;
        notesArea.innerHTML = notesHtml;
    } else {
        notesArea.innerHTML = `<h3>${teamNum} - ${teams[teamNum].name} Notes</h3><p>No notes available.</p>`;
    }
}

let draggedTeam = null;
let allianceSelections = {{ alliance_selections|tojson|safe }};

function drag(ev) {
    draggedTeam = ev.target.dataset.team;
    ev.dataTransfer.setData("text", ev.target.dataset.team);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function drop(ev, slotId) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const slot = document.getElementById(slotId);
    if (slot.children.length === 0) {
        const teamCube = document.createElement('div');
        teamCube.className = 'team-cube';
        teamCube.draggable = true;
        teamCube.dataset.team = data;
        teamCube.textContent = data;
        teamCube.ondragstart = drag;
        slot.appendChild(teamCube);

        updateAllianceSelections(data, slotId);
        updateAvailableTeams();
        saveAllianceSelections();
    }
}

function updateAllianceSelections(team, slotId) {
    if (slotId.startsWith('alliance')) {
        const allianceNum = slotId.split('-')[0];
        const slotType = slotId.split('-')[1];
        const index = slotType === 'captain' ? 0 : slotType === 'pick1' ? 1 : 2;
        if (!allianceSelections[allianceNum]) {
            allianceSelections[allianceNum] = [];
        }
        allianceSelections[allianceNum][index] = team;
    } else if (slotId === 'myFirstPickList') {
        allianceSelections['my_first_pick'].push(team);
    } else if (slotId === 'mySecondPickList') {
        allianceSelections['my_second_pick'].push(team);
    } else if (slotId === 'teamsAboveList') {
        allianceSelections['teams_above'].push(team);
    }
}

function updateAvailableTeams() {
    const availableTeamsDiv = document.querySelector('.available-teams');
    availableTeamsDiv.innerHTML = '<h3>Available Teams</h3>';
    const usedTeams = [];
    for (const alliance in allianceSelections) {
        if (Array.isArray(allianceSelections[alliance])) {
            allianceSelections[alliance].forEach(team => {
                if(team) {
                    usedTeams.push(team);
                }
            });
        }
    }
    const teams = {{ teams|tojson|safe }};
    for (const teamNum in teams) {
        if (!usedTeams.includes(teamNum)) {
            const teamCube = document.createElement('div');
            teamCube.className = 'team-cube';
            teamCube.draggable = true;
            teamCube.dataset.team = teamNum;
            teamCube.textContent = teamNum;
            teamCube.ondragstart = drag;
            availableTeamsDiv.appendChild(teamCube);
        }
    }
}

function saveAllianceSelections() {
    fetch('/alliance', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(allianceSelections)
    });
}

function removeTeam(teamNum, slotId) {
    if (slotId.startsWith('alliance')) {
        const allianceNum = slotId.split('-')[0];
        const slotType = slotId.split('-')[1];
        const index = slotType === 'captain' ? 0 : slotType === 'pick1' ? 1 : 2;
        if (allianceSelections[allianceNum] && allianceSelections[allianceNum][index] === teamNum) {
            allianceSelections[allianceNum][index] = null;
            document.getElementById(slotId).innerHTML = '';
        }
    } else if (slotId === 'myFirstPickList') {
        const index = allianceSelections['my_first_pick'].indexOf(teamNum);
        if (index > -1) {
            allianceSelections['my_first_pick'].splice(index, 1);
            document.getElementById(slotId).querySelector(`[data-team="${teamNum}"]`).remove();
        }
    } else if (slotId === 'mySecondPickList') {
        const index = allianceSelections['my_second_pick'].indexOf(teamNum);
        if (index > -1) {
            allianceSelections['my_second_pick'].splice(index, 1);
            document.getElementById(slotId).querySelector(`[data-team="${teamNum}"]`).remove();
        }
    } else if (slotId === 'teamsAboveList') {
        const index = allianceSelections['teams_above'].indexOf(teamNum);
        if (index > -1) {
            allianceSelections['teams_above'].splice(index, 1);
            document.getElementById(slotId).querySelector(`[data-team="${teamNum}"]`).remove();
        }
    }
    updateAvailableTeams();
    saveAllianceSelections();
}

document.querySelectorAll('.alliance-team-slot').forEach(slot => {
    slot.addEventListener('dragover', allowDrop);
    slot.addEventListener('drop', (ev) => drop(ev, slot.id));
    slot.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('team-cube')) {
            removeTeam(ev.target.dataset.team, slot.id);
        }
    });
});

document.querySelectorAll('.my-pick-list').forEach(list => {
    list.addEventListener('dragover', allowDrop);
    list.addEventListener('drop', (ev) => drop(ev, list.id));
    list.addEventListener('click', (ev) => {
        if (ev.target.classList.contains('team-cube')) {
            removeTeam(ev.target.dataset.team, list.id);
        }
    });
});

// Field View Logic
const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');
const fieldImage = new Image();
fieldImage.src = "{{ url_for('static', filename='topview.gif') }}";

let drawing = false;
let points = [];
let draggedCube = null;
let cubePositions = {};

fieldImage.onload = function() {
    ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
    placeCubes();
    loadDrawing();
};

function placeCubes() {
    const cubes = document.querySelectorAll('.team-cubes .team-cube');
    const cubeWidth = 30;
    const cubeHeight = 30;
    const spacing = 10;
    const redOffset = canvas.width - (cubeWidth * 3 + spacing * 2);

    cubes.forEach((cube, index) => {
        let x, y;
        if (index < 3) {
            x = spacing * (index + 1) + cubeWidth * index;
            y = 10;
        } else {
            x = redOffset + spacing * (index - 2) + cubeWidth * (index - 3);
            y = canvas.height - cubeHeight - 10;
        }

        if (cubePositions[cube.dataset.team]) {
            x = cubePositions[cube.dataset.team].x;
            y = cubePositions[cube.dataset.team].y;
        }

        cube.style.position = 'absolute';
        cube.style.left = `${x}px`;
        cube.style.top = `${y}px`;
        cube.style.width = `${cubeWidth}px`;
        cube.style.height = `${cubeHeight}px`;
        cube.style.zIndex = '100';
    });
}

function startDrawing() {
    drawing = true;
    points = [];
}

function resetDrawing() {
    points = [];
    ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
    placeCubes();
    saveDrawing();
}

canvas.addEventListener('mousedown', (e) => {
    if (drawing) {
        points.push({ x: e.offsetX, y: e.offsetY });
    } else {
        const cubes = document.querySelectorAll('.team-cubes .team-cube');
        cubes.forEach(cube => {
            const rect = cube.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                draggedCube = cube;
            }
        });
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (drawing && points.length > 0) {
        points.push({ x: e.offsetX, y: e.offsetY });
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        saveDrawing();
    } else if (draggedCube) {
        draggedCube.style.left = `${e.offsetX - draggedCube.offsetWidth / 2}px`;
        draggedCube.style.top = `${e.offsetY - draggedCube.offsetHeight / 2}px`;
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (drawing) {
        drawing = false;
    } else if (draggedCube) {
        cubePositions[draggedCube.dataset.team] = {
            x: parseInt(draggedCube.style.left),
            y: parseInt(draggedCube.style.top)
        };
        draggedCube = null;
    }
});

function saveDrawing() {
    fetch('/save_drawing', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(points)
    });
}

function loadDrawing() {
    fetch('/get_drawing')
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                points = data;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
}

function toggleDarkMode() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    const darkMode = body.classList.contains('dark-mode');
    fetch('/toggle_dark_mode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dark_mode: darkMode })
    });
}