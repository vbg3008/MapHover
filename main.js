document.getElementById('input').addEventListener('change', handleFile, false);

function handleFile(event) {
    var files = event.target.files;
    var file = files[0];

    var reader = new FileReader();
    reader.onload = function(event) {
        var data = new Uint8Array(event.target.result);
        var workbook = XLSX.read(data, {type: 'array'});

        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        var excelData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

        var updatedGeoJSON = updateGeoJSONWithExcelData(maharashtraConstituencies, excelData);
        initializeMap(updatedGeoJSON);
    };
    reader.readAsArrayBuffer(file);
}

function updateGeoJSONWithExcelData(geojson, excelData) {
    var headers = excelData[0];
    var data = excelData.slice(1);

    data.forEach(row => {
        var constituencyName = row[headers.indexOf('Constituency')];
        var winningParty = row[headers.indexOf('Winning Party')];
        var result = row[headers.indexOf('Result')];

        var feature = geojson.features.find(f => f.properties.name === constituencyName);
        if (feature) {
            feature.properties.winningParty = winningParty;
            feature.properties.result = result;
        }
    });

    return geojson;
}

function initializeMap(geojson) {
    // Initialize the map
    var map = L.map('map').setView([19.7515, 75.7139], 6); // Centered on Maharashtra

    // Add a tile layer to add to our map, in this case, it's a Mapbox Streets tile layer.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
    }).addTo(map);

    // Add GeoJSON data for Maharashtra constituencies
    L.geoJSON(geojson, {
        style: function (feature) {
            return {
                color: 'black',
                weight: 1,
                fillColor: getColor(feature.properties.winningParty),
                fillOpacity: 0.7
            };
        },
        onEachFeature: function (feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
            layer.bindPopup('<strong>Constituency:</strong> ' + feature.properties.name + '<br><strong>Winning Party:</strong> ' + feature.properties.winningParty + '<br><strong>Result:</strong> ' + feature.properties.result);
        }
    }).addTo(map);
}

// Function to get color based on party
function getColor(party) {
    switch (party) {
        case 'BJP': return '#ff0000';
        case 'SHS': return '#0000ff';
        case 'INC': return '#00ff00';
	case 'NCP': return '#000000';
        default: return '#ffffff';
    }
}

// Highlight feature on mouseover
function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        color: '#666',
        fillOpacity: 0.9
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}

// Reset highlight on mouseout
function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

// Zoom to feature on click
function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}
