let m = []; //Матрица расстояний
let rows = []; //Массив названий городов (по строкам)
let cols = []; //Массив названий городов (по столбцам)
let w = []; //Матрица весов
let dir = {}; //Объект направлений

let map; //Объект карта
let poly; //Объект полигон
let markers = []; //Массив точек

let div = document.getElementById("map");
let bn_calc = document.getElementById("bn_calc");
let bn_clear = document.getElementById("bn_clear");
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//   ПЕРВОЕ, ЧТО ВЫПОЛНЯЕТСЯ ПРИ ЗАХОДЕ
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
createMap(); //Создаем объекты карта/полигон/обработчики событий кнопок

//======================================================
// Транспонирование матрицы
//======================================================
const transpose = (matrix) =>
  matrix[0].map((col, i) => matrix.map((row) => row[i]));

//======================================================
// Вычитает минимальный элемент из каждой строки
//======================================================
function normalizeRows() {
  m = m.map((row) => row.map((e) => e - Math.min(...row)));
}

//======================================================
// Вычитает минимальный элемент из каждого столбца
//======================================================
function normalizeCols() {
  m = transpose(m);
  m = m.map((row) => row.map((e) => e - Math.min(...row)));
  m = transpose(m);
}

//======================================================
// Удаляет строку row в матрице
//======================================================
function deleteRow(row) {
  m.splice(row, 1);
  rows.splice(row, 1);
}

//======================================================
// Удаляет столбец col в матрице
//======================================================
function deleteCol(col) {
  m = transpose(m);
  m.splice(col, 1);
  cols.splice(col, 1);
  m = transpose(m);
}

//======================================================
// Находит оценку элемента (сумму минимальных элементов
// строки row и столбца col не включая элемент row,col)
//======================================================
function getWeight(row, col) {
  let minRow = Infinity;
  let minCol = Infinity;

  minRow = Math.min(...m[row].filter((e, i) => i != col));
  m = transpose(m);
  minCol = Math.min(...m[col].filter((e, i) => i != row));
  m = transpose(m);
  return minRow + minCol;
}

//======================================================
// Возвращает массив замкнутых циклов
//======================================================
function findSubCycles() {
  let arrClosePath = [];

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      let col = cols[c];
      let to = undefined;
      let from = dir[col];
      if (from != undefined) {
        from = col;
        do {
          to = dir[from];
          if (to != undefined) {
            if (to == rows[r]) arrClosePath.push([rows[r], col]);
            from = to;
          }
        } while (to != undefined);
      }
    }
  }
  return arrClosePath;
}

//======================================================
// Удаляет элементы массива, соответствующие замкнутым циклам
//======================================================
function deleteSubCycles(arr) {
  if (arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      let ir = rows.indexOf(arr[i][0]);
      let ic = cols.indexOf(arr[i][1]);
      if (ir != -1 && ic != -1) m[ir][ic] = Infinity;
    }
  }
}
//======================================================
// Находит путь и заносит его в объект dir
//======================================================
function findPath() {
  let w = [].concat(
    m.map((row, i) => row.map((e, j) => (e == 0 ? getWeight(i, j) : 0)))
  ); // рассчет оценок
  console.log("**********************");
  console.log(w);
  console.log("**********************");
  let maxWeight = Math.max(...w.flat());
  console.log( "MaxWeight:",maxWeight);
  //console.log(w);
  //debugger
  let maxElementPos = { row: 0, col: 0, val: -1 };
  for (let j = 0; j < m.length; j++)
    for (let i = 0; i < m.length; i++)
      if (w[i][j] == maxWeight && maxElementPos.val == -1)
        maxElementPos = { row: i, col: j, val: maxWeight };

  let from = rows[maxElementPos.row]; //Пункт отправления
  let to = cols[maxElementPos.col]; //Пункт назначения
  dir[from] = to; //Заносим найденный отрезок пути в объект
  console.log(dir);
  console.log(`from: ${from}  to: ${to}`);

  if (m.length == 1) {
    return false;
  }

  let a = findSubCycles();
  console.log(a);
  deleteSubCycles(a);

  deleteRow(maxElementPos.row); //Удаляем строку с максимальным весом
  deleteCol(maxElementPos.col); //Удаляем столбец с максимальным весом

  console.log(m);
  console.log(`rows: [${rows}]  cols: [${cols}]`);
  return true;
}

//======================================================
//Создание матрицы расстояний по координатам маркетов
//======================================================
function createMatrix() {
  m = Array.from({ length: markers.length }, (_, i) =>
    Array.from({ length: markers.length }, () => Infinity)  //ЗАПИСЬ МАССИВА
  );
  rows = Array.from({ length: markers.length }, (_, i) => i); //Массив названий городов (по строкам)
  cols = Array.from({ length: markers.length }, (_, i) => i); //Массив названий городов (по столбцам)
  dir = {}; //Обнуляем объект путей

  for (let i = 0; i < markers.length; i++)
    for (let j = 0; j < markers.length; j++)
      if (j != i)                                 //фактическая запись массива тут 
        m[i][j] = Math.round(
          getDistance(markers[i].getPosition(), markers[j].getPosition())
        ); // в качестве параметров функции задаются маркеры и мы получаем их координаты
}

//======================================================
// Основная функция (рассчет оптимального пути)
//======================================================
function calculate() {
  do {
    console.log("---------------------");
    console.log(m);
    console.log(`rows: [${rows}]  cols: [${cols}]`);

    normalizeRows(); //вычитание мин из строки 
    normalizeCols(); // вычитание мин из строки
    console.log("after normilize:");
    console.log(m);
  } while (findPath());
}

//======================================================
// Функция создания объектов карта/полигон,
// обработчиков событий кнопок
//С ЭТОЙ ФУНКЦИИ ВСЕ И НАЧИНАЕТСЯ
//======================================================

function createMap() {
  const elbrus = { lat: 52.1, lng: 23.7 }; //переменная для центра нашей карты
  map = new google.maps.Map(document.getElementById("map"), { //создание нашей карты
    zoom: 10, // масштаб
    center: elbrus,
  }); //ПОНЯТО

  map.addListener("click", addMarker);  //Обработчик клика по карте
  //===============================
  poly = new google.maps.Polyline({
    //path: [],
    geodesic: true,
    strokeColor: "#406d5a",
    strokeOpacity: 1.0,
    strokeWeight: 2,
  });
  poly.setMap(map); //ПОНЯТО

  bn_clear.onclick = () => deleteMarkersAndPath(); // ПРИ  НАЖАТИИ НА КНОПКУ ОЧИСТИТЬ УДАЛЯЮТСЯ МАРКЕРЫ
  bn_calc.onclick = () => {                        // ПРИ НАЖАТИИ НА КНОПКУ РАССЧИТАТЬ
    createMatrix();                                //СОЗДАНИЕ МАТРИЦЫ+
    calculate();                                   //Рассчет 
    DrawPath();
  };
}

//======================================================
// Рисует соединения между точками маршрута
//======================================================
function DrawPath() {
  let arr = [0];
  let point = 0;
  const path = [];
  for (let i = 0; i < markers.length; i++) {
    point = dir[point];
    arr.push(point);
  }
  console.log(arr);

  for (let i = 0; i < arr.length; i++) {
    path.push(markers[arr[i]].position);
  }
  poly.setPath(path);
}

//======================================================
// Добавляет маркер на карту
//======================================================
function addMarker(event) {
  //Ограничеваем количество маркеров
  if (markers.length > 50) return; //проверяет значение массива

  const marker = new google.maps.Marker({
    position: event.latLng, //тут описывается позиция нашего маркера, которую мы получим когда кликнем по карте
    map: map,
    label: "" + markers.length, // нумеруются наши маркеры
  });
  for (let i = 0; i < markers.length; i++) {
    //Проверяем наложение маркеров по координатам и если таковое имеет место быть - удаляем маркер
    if (
      JSON.stringify(markers[i].position) == JSON.stringify(marker.position) // сравнение одного элемента со занчением всего массива, но до этотого он преобразует его в строку JSON, чтобы знаечения были одинаковы
    ) {
      marker.setMap(null); // если такое значение уже имеется, то на карту мы его не добавляем
      return;
    }
  }
  markers.push(marker);
  if (markers.length > 1) bn_calc.disabled = false; //?????????????? РАЗОБРАТЬСЯ 
}

//======================================================
// Удаление маркеров
//======================================================
function deleteMarkersAndPath() {
  markers.forEach((e) => e.setMap(null));
  markers = [];
  const path = poly.getPath();
  while (path.length) path.pop();
  bn_calc.disabled = true;
}

//======================================================
//кароче, тут мы используем штуку для преобразования наших меток в метры
//для этого мы используем формулу Хаверсина
// при становленни метки мы получаем широту и долготу, а формула хаверсина позволяет вычислить рассояние между двумя метками 
//используя широту и долготу как раз!!!
//======================================================
let rad = function (x) {
  return (x * Math.PI) / 180; // тут кароче функшион для преобразования наших широт и долгот в радианы
};
//кароче, ниже идет онли формула Хаверсина 

let getDistance = function (p1, p2) {
  let R = 6378137; // радиус Земли
  let dLat = rad(p2.lat() - p1.lat()); // разность между широтами
  let dLong = rad(p2.lng() - p1.lng()); // разность между долготой
 //1 = sin^2(разность широт/2)+cos(широта1)*cos(широта2)*sin^2(разностб долготы/2)
  let a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat())) *
    Math.cos(rad(p2.lat())) *
    Math.sin(dLong / 2) *
    Math.sin(dLong / 2);
    //2 = арктангенс(корня(1))
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = R * c;
  return d; // returns the distance in meter
};