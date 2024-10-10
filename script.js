// API Key and base URL for Alpha Vantage
const API_KEY = '56WWCHQF1Z28CYK2';
const API_URL = 'https://www.alphavantage.co/query';

// Load Google Charts and initialize after page load
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(drawCharts);

// Draw all charts once loaded
function drawCharts() {
    fetchStockData().then(stockData => {
        drawMovingAverageChart(stockData);
        drawBollingerBands(stockData);
        drawHeatmap(stockData);
        drawPieChart(stockData);
    });
}

// Fetch stock data from Alpha Vantage API
async function fetchStockData() {
    const response = await fetch(`${API_URL}?function=TIME_SERIES_DAILY&symbol=MSFT&apikey=${API_KEY}`);
    const data = await response.json();
    return transformStockData(data['Time Series (Daily)']);
}

// Transform stock data to required format
function transformStockData(timeSeries) {
    const stockData = [];
    for (const [date, values] of Object.entries(timeSeries)) {
        stockData.push({
            date: new Date(date),
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseFloat(values['5. volume'])
        });
    }
    return stockData;
}

// Moving Average Chart
function drawMovingAverageChart(stockData) {
    const data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'SMA (10-day)');

    // Calculate 10-day moving average
    const smaData = calculateMovingAverage(stockData, 10);
    smaData.forEach(row => {
        data.addRow([row.date, row.sma]);
    });

    const options = {
        title: 'Simple Moving Average (SMA)',
        hAxis: { title: 'Date', format: 'MMM dd' },
        vAxis: { title: 'SMA (Price in USD)' },
        legend: 'none',
    };

    const chart = new google.visualization.LineChart(document.getElementById('moving_average_chart'));
    chart.draw(data, options);
}

// Calculate Moving Average
function calculateMovingAverage(stockData, days) {
    let smaData = [];
    for (let i = days - 1; i < stockData.length; i++) {
        const avg = stockData.slice(i - days + 1, i + 1).reduce((sum, row) => sum + row.close, 0) / days;
        smaData.push({ date: stockData[i].date, sma: avg });
    }
    return smaData;
}

// Bollinger Bands Chart
function drawBollingerBands(stockData) {
    const data = new google.visualization.DataTable();
    data.addColumn('date', 'Date');
    data.addColumn('number', 'Close Price');
    data.addColumn('number', 'Upper Band');
    data.addColumn('number', 'Lower Band');

    const bollingerData = calculateBollingerBands(stockData, 20);
    bollingerData.forEach(row => {
        data.addRow([row.date, row.close, row.upperBand, row.lowerBand]);
    });

    const options = {
        title: 'Bollinger Bands',
        hAxis: { title: 'Date', format: 'MMM dd' },
        vAxis: { title: 'Price (USD)' },
        seriesType: 'line',
        series: { 1: { type: 'line', color: 'green' }, 2: { type: 'line', color: 'red' } },
    };

    const chart = new google.visualization.ComboChart(document.getElementById('bollinger_chart'));
    chart.draw(data, options);
}

// Calculate Bollinger Bands
function calculateBollingerBands(stockData, days) {
    const smaData = calculateMovingAverage(stockData, days);
    let bands = [];
    for (let i = days - 1; i < stockData.length; i++) {
        const sma = smaData[i - (days - 1)].sma;
        const stddev = Math.sqrt(stockData.slice(i - days + 1, i + 1).reduce((sum, row) => sum + Math.pow(row.close - sma, 2), 0) / days);
        bands.push({
            date: stockData[i].date,
            close: stockData[i].close,
            upperBand: sma + (2 * stddev),
            lowerBand: sma - (2 * stddev)
        });
    }
    return bands;
}

// Heatmap for Price vs Volume
function drawHeatmap(stockData) {
    const data = new google.visualization.DataTable();
    data.addColumn('number', 'Price');
    data.addColumn('number', 'Volume');

    stockData.forEach(row => {
        data.addRow([row.close, row.volume]);
    });

    const options = {
        title: 'Price vs Volume Heatmap',
        hAxis: { title: 'Price (USD)' },
        vAxis: { title: 'Volume' },
        legend: { position: 'none' },
        colors: ['#e5f5e0', '#31a354'],
    };

    const chart = new google.visualization.ScatterChart(document.getElementById('heatmap_chart'));
    chart.draw(data, options);
}

// Pie Chart for Closing Prices
function drawPieChart(stockData) {
    const data = new google.visualization.DataTable();
    data.addColumn('string', 'Date');
    data.addColumn('number', 'Closing Price');

    // Prepare data for the pie chart
    stockData.forEach(row => {
        data.addRow([row.date.toLocaleDateString(), row.close]);
    });

    const options = {
        title: 'Distribution of Closing Prices',
        is3D: true,
    };

    const chart = new google.visualization.PieChart(document.getElementById('pie_chart'));
    chart.draw(data, options);
}
