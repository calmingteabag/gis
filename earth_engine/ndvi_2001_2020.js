
var brazilPoligon = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na', 'Brazil'));
// Para o meu 'eu' do futuro que por ventura volte a olhar isso, deixei um monte de
// comentarios. Espero que isso te ilumine o caminho.

// Nesse "script" especifico, estou fazendo uma analise (meio por cima) das áreas
// de vegetação que não estão saudavéis usando sensor de Near-IR e o de cor vermelha.
// (leia sobre 'ndvi index')

// Seleciona que tipo de imagens de sensores e de qual satelite queremos
var collection = ee.ImageCollection("LANDSAT/LE07/C02/T1_TOA").filterBounds(brazilPoligon)

// O problema de quando o satelite faz passada é que pode ter nuvens e elas
// interferem na onda refletida, então temos que filtrar as imagens que tem
// muitas nuvens usando o algoritimo proprio do google.
// O .map é usado pq temos que percorrer toda a coleção fazendo isso. O que ocorre
// no map é primeiro ele cria uma pontuação de acordo com a quantidade de nuvens que
// tem na imagem (de 0 - sem nuvens, até 100, - 100% nuvens). Partindo disso, criamos
// uma mascara e selecionamos a quantidade de nuvens que queremos. lte significa
// less than or equal(valor).
// O map vai retornar a mesma coleção, porém com os pixels filtrados (por isso o
// updateMask)
var old_collection = collection.filterDate('2001-01-01', '2001-12-31')
    .map(function (old_collection_element) {
        var score_old = ee.Algorithms.Landsat.simpleCloudScore(old_collection_element)
        var mask_old = score_old.select(['cloud']).lte(50)
        return old_collection_element.updateMask(mask_old)
    })

// A partir das imagens filtradas, fazemos o calculo do NDVI. Novamente via .map()
// para aplicar em toda coleção de imagens.
var old_ndvi = old_collection.map(function (old_collection) {
    return old_collection.normalizedDifference(['B4', 'B3'])
})

// A essa altura vc deve estar se perguntando o que fazer com collections ou
// old_collections, já que em teoria, é um conjunto de imagens. Mas vc não precisa
// fzer nada que antes de exibir as coisas, ele seleciona os pixels mais representativos
// do conjunto que vc tem e mostra no mapa, então nesse caso específico, não é preciso
// nenhuma operação extra. Mas é possivel usar coisas como median() ou max() para
// retornar valores especificos. 


// repetição do processo que vimos em old_collection
var new_collection = collection.filterDate('2020-01-01', '2021-12-31')
    .map(function (new_collection_element) {
        var score_new = ee.Algorithms.Landsat.simpleCloudScore(new_collection_element)
        var mask_new = score_new.select(['cloud']).lte(50)
        return new_collection_element.updateMask(mask_new)
    })

var new_ndvi = new_collection.map(function (new_collection) {
    return new_collection.normalizedDifference(['B4', 'B3'])
})


// Hora de adicionar os mapas que criamos como layers
// O ndvi gera valores entre -1 e 1, então colocamos isso como min e max.
// Precisamos de uma palheta de cores, se não tudo é exibido como cinzas
Map.addLayer(old_ndvi, { min: -1, max: 1, palette: ['red', 'orange', 'yellow', 'green', 'blue'] }, 'NDVI_old')
Map.addLayer(new_ndvi, { min: -1, max: 1, palette: ['red', 'orange', 'yellow', 'green', 'blue'] }, 'NDVI_new')


