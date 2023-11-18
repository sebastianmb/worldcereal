var limit = ee.FeatureCollection(table);
Map.centerObject(limit, 9);

/**
 * Function to mask clouds using the Sentinel-2 QA band
 * @param {ee.Image} image Sentinel-2 image
 * @return {ee.Image} cloud masked Sentinel-2 image
 */
function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
      .and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return image.updateMask(mask).divide(10000);
}

var datasetS2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
                  .filterDate('2021-01-01', '2021-01-30')
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE',20))
                  .filterBounds(limit)
                  .map(maskS2clouds);

var visualizationS2 = {
  min: 0.0,
  max: 0.3,
  bands: ['B8', 'B4', 'B3'],
};

Map.addLayer(datasetS2.mean(), visualizationS2, 'FalseColor - Sentinel 2');

var datasetWorldCereal = ee.ImageCollection('ESA/WorldCereal/2021/MODELS/v100');

// Function to mask the "other" class (value 0) in the images
function mask_other(img) {
  return img.updateMask(img.neq(0));
}

// Apply the mask_other function to the collection
datasetWorldCereal = datasetWorldCereal.map(mask_other);

// Get a global mosaic for all agro-ecological zone (AEZ) of temporary crops
var temporarycrops = datasetWorldCereal.filter('product == "temporarycrops"').mosaic();

var visualization_class = {
  bands: ["classification"],
  max: 100,
  palette: ["blue", "green", "yellow", "orange"]
};

var visualization_conf = {
  bands: ['confidence'],
  min: [0],
  max: [100],
  palette: ['be0000','fff816','069711'],
};

Map.centerObject(limit);
Map.addLayer(limit, {color: 'lightblue'}, 'Limit Boundaries');
Map.addLayer(temporarycrops, visualization_class, 'Temporary crops within Limit');

Map.addLayer(
  temporarycrops, visualization_conf, 'Temporary crops confidence within Limit', false
);

var tc_maize_main_46172 = datasetWorldCereal
  .filter(ee.Filter.eq('season', 'tc-maize-main'))
  .filter(ee.Filter.eq('aez_id', 46172))
  .filterBounds(limit);

var maize = tc_maize_main_46172.filter('product == "maize"');
var irrigation = tc_maize_main_46172.filter('product == "irrigation"');

var visualization_maize = {
  bands: ["classification"],
  max: 100,
  palette: ["#ebc334"]
};

var visualization_irrigation = {
  bands: ["classification"],
  max: 100,
  palette: ["#2d79eb"]
};

Map.addLayer(maize, visualization_maize, 'Maize within Limit');
Map.addLayer(irrigation, visualization_irrigation, 'Active irrigation within Limit');

// Añadir título
var titleLabelLine1 = ui.Label({
  value: 'Mapa de Cosechas y Cultivos 2021 Art49 ',
  style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 0'}
});
var titleLabelLine2 = ui.Label({
  value: 'The European Space Agency (ESA) WorldCereal 10 m 2021 product suite consists of global-scale annual and seasonal crop maps and their related confidence',
  style: {fontWeight: 'bold', fontSize: '16px', margin: '10px 0'}
});
var titleLabelLine3 = ui.Label({
  value: 'Sentinel 2021 Falso color',
  style: {fontWeight: 'bold', fontSize: '16px', margin: '0'}
});

Map.add(ui.Panel([titleLabelLine1, titleLabelLine2,titleLabelLine3]));


// Añadir leyenda
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px'
  }
});

var legendTitle = ui.Label({
  value: 'Leyenda',
  style: {fontWeight: 'bold', fontSize: '18px'}
});

legend.add(legendTitle);

var legendLabels = ['Temporary crops', 'Maize', 'Active irrigation'];
var legendColors = ['orange', 'green', '#2d79eb'];

for (var i = 0; i < legendLabels.length; i++) {
  var label = ui.Label({
    value: legendLabels[i],
    style: {fontSize: '14px', margin: '2px 3px'}
  });

  var colorBox = ui.Label({
    style: {
      backgroundColor: legendColors[i],
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });

  legend.add(colorBox).add(label);
}

Map.add(legend);
