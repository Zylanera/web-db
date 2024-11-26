const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Definieren Sie den Pfad zur Log-Datei
const logDirectory = path.join(__dirname, '../logs'); // Verzeichnis für Logs

// Erstellen Sie einen Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: path.join(logDirectory, '%DATE%.log'), // Log-Dateiname mit Datum
            datePattern: 'YYYY-MM-DD', // Datumsformat für die Dateinamen
            zippedArchive: true, // Komprimierung der alten Log-Dateien
            maxSize: '2000m', // Maximale Größe der Log-Datei
            maxFiles: '360d' // Bewahre Logs für 14 Tage
        }),
        new winston.transports.Console() // Protokolliere auch in der Konsole
    ],
});

// Erstellen Sie das Verzeichnis, falls es nicht existiert
require('fs').existsSync(logDirectory) || require('fs').mkdirSync(logDirectory);

module.exports = logger;
