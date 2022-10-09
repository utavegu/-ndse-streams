#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const ENCODING = 'utf8';

const arg = process.argv.slice(2);

const dirPath = path.join(__dirname, 'statistics');
const filePath = path.join(dirPath, 'log.json');

const createCallback = (error) => {
  if (error) {
    throw Error(error)
  }
}

fs.stat(dirPath, (error) => {
  if (!error) {
    // console.log('Такая директория уже существует');
  } else if (error.code === 'ENOENT') {
    fs.mkdir(dirPath, createCallback)
  }
});


fs.access(filePath, (error) => {
  if (error) {
    // console.log("Файл не найден, сейчас создам");
    fs.appendFile(filePath, '[]', createCallback);
  } else {
    // console.log("Файл найден");
  }
});

// БАГ: Код, начиная со строчки ниже, выдаст ошибку - "файл лога не доступен", если запусть программу с флагами -A или -L при условии, что директория и файл еще не созданы. Я понимаю, что тут асинхронщина и скорее всего он просто не успевает создать файл и обращается к нему, пока он еще не появился, но как это исправить тут - понять не могу.
// ПС: Получилось смоделировать ситуацию, когда ошибка выскочила и с вызовом без флага
const logData = fs.readFileSync(filePath, ENCODING);
const results = JSON.parse(logData);
let roundNumber = results?.length;
roundNumber++;

if (arg[0]) {
  if (arg[0] === '-L') {
    console.log('Статистика завершенных партий:\n', results)
  } else if (arg[0] === '-A') {
    console.log('Аналитика')
    console.log('Общее количество партий: ', results?.length)
    const winsCount = results?.filter(elem => elem.result === 'win').length;
    const losesCount = results.length - winsCount;
    const winsPercent = Math.round(winsCount*100/results.length);
    const losesPercent = Math.round(losesCount*100/results.length);
    console.log(`Побед: ${winsCount} (${winsPercent}%), поражений: ${losesCount} (${losesPercent}%)`)
  } else {
    console.log('Неизвестный флаг!')
  }
} 
else {
  const thinkingNumber = Math.floor(Math.random() * 2) + 1;

  const rl = readline.createInterface({ input, output });
  rl.question('1 или 2?\n', (answer) => {
    console.log(`Загаданное число: ${thinkingNumber}\nТвой ответ: ${answer}`);

    if (Number(answer) === thinkingNumber) {
      console.log('Победа!');
      results.push({ round: roundNumber, result: 'win', date: new Date().toLocaleString() })
    } else {
      console.log('Увы =(');
      results.push({ round: roundNumber, result: 'lose', date: new Date().toLocaleString() })
    }

    const writerSrt = fs.createWriteStream(filePath);
    writerSrt.write(JSON.stringify(results), ENCODING);
    writerSrt.end();

    rl.close();
  });
}
