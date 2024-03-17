/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoibmF0a2VjIiwiYSI6ImNscjZudnpsdjJhcm8ya21jMXJuY29iYWwifQ.KonIboWryT9OOwjzC-0GTg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/standard',  // ****ADD MAP STYLE HERE *****
    center: [-79.376621, 43.687573],  // starting point, longitude/latitude
    zoom: 11 // starting zoom level
});

//Map Controls 
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());
//declaring geocoder variable and seeting search to only Canada 
const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    countries: "ca"
});
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

//Event listener for returning viewer to original map extent
document.getElementById('returnbutton').addEventListener('click', () => {
    map.flyTo({
        center: [-79.376621, 43.687573],
        zoom: 11,
        essential: true
    });
});


//Fetching and converting data to a GeoJSON format
let collisiongeojson;

// Fetch GeoJSON from URL and store response
fetch('https://natalikec.github.io/Lab4/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {

        collisiongeojson = response; // Store geojson as variable using URL from fetch response
    });

map.on('load', () => {


    //Creating Hex Grid + Adding code to get bbox geometry in correct order
    let bboxgeojson;

    let bbox = turf.envelope(collisiongeojson)
    //increaseing hexgrid size so all points fall within it
    let bboxscaled = turf.transformScale(bbox, 1.10);

    bboxgeojson = {
        "type": "FeatureCollection",
        "feature": [bboxscaled]

    }

    //In correct order
    let bboxcoords = [bboxscaled.geometry.coordinates[0][0][0],
    bboxscaled.geometry.coordinates[0][0][1],
    bboxscaled.geometry.coordinates[0][2][0],
    bboxscaled.geometry.coordinates[0][2][1]
    ]
    //each hexigon's size 
    let hexgeojson = turf.hexGrid(bboxcoords, 0.3, { units: 'kilometers' });

    //Aggregate collisin data by hexgrid
    let collishex = turf.collect(hexgeojson, collisiongeojson, '_id', 'values')
    console.log(collishex)

    //Forloop
    let maxcollis = 0;
    collishex.features.forEach((feature) => { //for each feature in the array, the following code will run
        feature.properties.COUNT = feature.properties.values.length //counts the amount of vallues and stores it in COUNT
        if (feature.properties.COUNT > maxcollis) { //if the COUNT value is bigger than the maxcollis value, 
            console.log(feature); //if the above is true, log the feature
            maxcollis = feature.properties.COUNT // if the conditional if statement is true, it updates the maxcollis value 
        }
    });

    //Display Data 
    //Hex Grid
    map.addSource('collis-hex', {
        type: 'geojson',
        data: hexgeojson
    });

    // creating a step color gradiant going up in 5s (adding the 0.5 to have a 0 value)
    map.addLayer({
        'id': 'collis-hex-fill',
        'type': 'fill',
        'source': 'collis-hex',
        'paint': {
            'fill-color': [
                'step',
                ['get', 'COUNT'],
                '#848287',
                0.5, '#d4b9da',
                5, '#c994c7',
                10, '#df65b0',
                15, '#dd1c77',
                20, '#980043'
            ],
            'fill-opacity': 0.85,
            'fill-outline-color': "grey"
        }
    });

    //Collision Points
    map.addSource('collision', {
        type: 'geojson',
        data: collisiongeojson
    });

    map.addLayer({
        'id': 'collisionpoints',
        'type': 'circle',
        'source': 'collision',
        'paint': {
            'circle-radius': [
                "interpolate", ["linear"], ["zoom"],
                // zoom is 11 or less -> circle radius 1px
                11, 1,
                // zoom is 14 or more -> circle radius 5px
                14, 5
            ],
            'circle-color': 'black'
        }
    });

    //Using Checked box to add and remove layers
    //For Hexgrid
    document.getElementById('hexcheck').addEventListener('change', (e) => {
        map.setLayoutProperty(
            'collis-hex-fill',
            'visibility',
            e.target.checked ? 'visible' : 'none'
        );
    });
    //For Points
    document.getElementById('pointcheck').addEventListener('change', (e) => {
        map.setLayoutProperty(
            'collisionpoints',
            'visibility',
            e.target.checked ? 'visible' : 'none'
        );
    });

  // Adding pop up for collision points
    map.on('click', 'collisionpoints', (e) => {
         //event listener for clicking on point
        const coordinates = e.features[0].geometry.coordinates.slice();
    
        // Retrieves properties
        const properties = e.features[0].properties;
    
        // Generating text including multiple properties
        let display = '<h5>Collision Details</h5>';
        display += '<p><strong>Collision with:</strong> ' + properties.INVTYPE + '</p>';
        display += '<p><strong>Injury:</strong> ' + properties.INJURY + '</p>';
        display += '<p><strong>Year:</strong> ' + properties.YEAR + '</p>';
        display += '<p><strong>Visibility:</strong> ' + properties.VISIBILITY + '</p>';
       
    
    
        new mapboxgl.Popup()
            // Creating the popup display
            .setLngLat(coordinates)
            // Makes the popup appear at the point features coordinates
            .setHTML(display)
            // Retrieves the display property which has been set above
            .addTo(map);
        // Adds popup to map
    });

    //Legend
    //Declare arrayy variables for labels and colours
    const legendlabels = [
        '0',
        '<5',
        '5-10',
        '10-15',
        '15-20',
        '>=20'
    ];

    const legendcolours = [
        '#848287',
        '#d4b9da',
        '#c994c7',
        '#df65b0',
        '#dd1c77',
        '#980043'
    ];

    //Declare legend variable using legend div tag
    const legend = document.getElementById('legend');

    //For each layer create a block to put the colour and label in
    legendlabels.forEach((label, i) => {
        const color = legendcolours[i];

        const item = document.createElement('div'); //each layer gets a 'row'
        const key = document.createElement('span'); //add a 'key' to the row (color). 

        key.className = 'legend-key'; //the key will take on the shape and style properties defined in css
        key.style.backgroundColor = color; // the background color is retreived from the layers array

        const value = document.createElement('span'); //add a value variable to the 'row' in the legend
        value.innerHTML = `${label}`; //give the value variable text based on the label

        item.appendChild(key); //add the key (color cirlce) to the legend row
        item.appendChild(value); //add the value to the legend row

        legend.appendChild(item); //add row to the legend

    });

});


