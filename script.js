/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/


// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoibmF0a2VjIiwiYSI6ImNscjZudnpsdjJhcm8ya21jMXJuY29iYWwifQ.KonIboWryT9OOwjzC-0GTg'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/mapbox/standard',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
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
    let hexgeojson = turf.hexGrid(bboxcoords, 0.5, { units: 'kilometers' });

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

    map.addLayer({
        'id': 'collis-hex-fill',
        'type': 'fill',
        'source': 'collis-hex',
        'paint': {
            'fill-color': [
                'step',
                ['get', 'COUNT'],
                '#380111',
                10, '#bd0026',
                25, '#f07577'
            ],
            'fill-opacity': 0.5,
            'fill-outline-color': "white"
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
            'circle-radius': 5,
            'circle-color': 'blue'
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

});







// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows




