/* 
"Estudo" de locais de potencial implantação de usinas solares no Brasil

Esse é na realidade uma brincadeira que fiz para conhecer melhor o 
Earth Engine. O que fiz foi usar dados de três satelites diferentes e
cruzar os dados (gnericamente falando).

Parti do pressuposto que as usinas tem que ser instaladas em locais relativamente
planos de declividade menor que 5º, com pouca chuva durante e de temperatura
de superfície média elevada durante o ano.

Sobre a parte técnica, não há muito o que mencionar. Geralmente se começa com um
conjunto de imagens dos sensores e se aplicam os filtros (por data primeiramente).
Dependendo dos dados, pode-se selecionar os sensores e as bandas que se quer.

Tambem dependendo do tipo de dados, podemos extrair uma media de todos os dados e
o programa vai retornar um 'mapa' com o valor médio dos pixels de todas as imagens
da série. 

Em outros, precisa-se filtrar as imagens e excluir as que não nos interessam, por exemplo
excluir as imagens landsat com muitas nuvens.

Pode-se usar um poligono para delimitar a area de interesse e usar os mapas anteriores
como mascara para os posteriores (.updateMask()) onde se pode gerarum mapa de chuvas
e usar em um de temperatura para achar, por exemplo, áreas de seca em que as áreas de
alta temperatura e baixa concentação de chuvas se interpolam.
*/




// Normalizador
function getNormalValue(value, minValue, maxValue) {
    return (value - minValue) / (maxValue - minValue);
}

// Poligono Brasil
var brazilPoligon = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na', 'Brazil'));


/* 
Declividade 

Acabei usando o srtm por ser mais simples, mas crio que exista coisa
melhor em ais precisa que a resolução dele.

*/
var srtm = ee.Image('CGIAR/SRTM90_V4').clip(brazilPoligon);
var elevation = srtm.select('elevation');

var slope = ee.Terrain.slope(elevation).unitScale(0, 90); // unitscale para normalizar
var slopeFilterValue = getNormalValue(2, 0, 90);
var slopeFilter = slope.updateMask(slope.lte(slopeFilterValue));

var slopeValues = {
    min: 0,
    max: 1,
    palette: ['00571E', '057E2E', '0AA53E', '0FEA4F', '5CF067', 'ABFF80', 'E0FFB2', 'F6FFD4', 'FFD98E', 'FFA500']
}


/* 
Incidencia solar

Explicando os valores dessa coleção:
Os valores estão em kelvin mas segundo a Nasa, eles
precisam ser convertidos para se chegar a um valor em celcius. A
formula genérica é celcius = (valor * 0.02) - 273

Partido disso, eu 'chutometrei' que 60ºC de temperatura da superficie
(não do ar) indicaria uma região com alta incidencia de luz solar. 

*/

var surfTemp = ee.ImageCollection('MODIS/061/MOD11A2')
    .filterDate('2016-01-01', '2021-01-01')
    .select('LST_Day_1km').mean().clip(brazilPoligon)
var surfTempNorm = surfTemp.unitScale(7500, 65535)

var maskValue = 15250
var normalMaskValue = getNormalValue(15250, 7500, 65535)

var surfTempMask = surfTemp.gte(maskValue)
var surfTempMaskNormal = surfTempNorm.gte(normalMaskValue)

var surfTempMasked = surfTemp.updateMask(surfTempMask)
var surfTempNormMasked = surfTempNorm.updateMask(surfTempMaskNormal)

var surfaceTempVariables = {
    min: 0,
    max: 1,
    palette: ['00571E', '057E2E', '0AA53E', '0FEA4F', '5CF067', 'ABFF80', 'E0FFB2', 'F6FFD4', 'FFD98E', 'FFA500'],
};


/* 

Precipitação 

Não consegui normalizar os dados pois não achei o intervalo de valores dos
dados. Poderia ter estimado usando o proprio visualizador de layers do
earth engine, usando a parte que ele reajusta os pixels baseado no histograma
(stretch), mas achei melhor não mexer nos valores.

*/
var rainDataset = ee.ImageCollection('NASA/GPM_L3/IMERG_MONTHLY_V06')
    .filterDate('2016-01-01', '2021-01-01');

var chuva = rainDataset.select('precipitation').median();
var chuvaMask = chuva.lte(0.10);
var chuvaMasked = chuva.updateMask(chuvaMask);
var chuvaCliped = chuvaMasked.clip(brazilPoligon)

var chuvaVariables = {
    min: 0,
    max: 1,
    palette:
        ['1621a2', 'ffffff', '03ffff', '13ff03', 'efff00', 'ffb103', 'ff2300']
};


var solarPower = slopeFilter.updateMask(surfTempNormMasked.gt(0)).updateMask(chuvaCliped.gt(0))

Map.addLayer(solarPower, {}, 'result')
Map.addLayer(slopeFilter, slopeValues, 'slope');
Map.addLayer(surfTempNormMasked, surfaceTempVariables, 'surface_temp');
Map.addLayer(chuvaCliped, chuvaVariables, 'chuva');

Map.setCenter(-48.38829058001818, -12.071793989012475, 3);


















