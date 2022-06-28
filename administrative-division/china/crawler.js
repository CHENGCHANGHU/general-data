// administrative division

const request = require('request');
const fs = require('fs');

const textOfTdRE = /<td[^<>]*?>(.+?)<\/td>/g;
const textOfHTMLTag = />([^<>]+?)</g;

request({
  url: 'http://www.mca.gov.cn/article/sj/xzqh/2020/20201201.html',
  method: 'GET',
}, (error, response, body) => {
  const filteredBody = body
    .replace(/<td[^<>]*><\/td>/g, '')
    .replace(/<tr[^<>]*>[\s]*<\/tr>/g, '')
    .replace(/>[\s]*</g, '><');
  const trs = filteredBody.match(/<tr[^<>]*><td[^<>]*>\d+<\/td><td[^<>]*>.+?<\/td><\/tr>/g);

  const administrativeDivisionArr = trs.map(tr => {
    const extractedTexts = [];
    let execRes = textOfHTMLTag.exec(tr);
    while (execRes) {
      extractedTexts.push(execRes[1]);
      execRes = textOfHTMLTag.exec(tr);
    }
    return {
      code: Number(extractedTexts[0]),
      name: extractedTexts[1],
    };
  });

  const provinces = [];
  let tempADArr = administrativeDivisionArr;
  while (tempADArr.length) {
    let { code, name } = tempADArr.shift();
    if (code % 10000 === 0) {
      provinces.push({ code, name, type: 'province' });
    } else if (code % 100 === 0) {
      const provinceCode = Math.floor(code / 10000) * 10000;
      const province = provinces.find(({ code }) => code === provinceCode);
      if (!province.cities) {
        province.cities = [{ code, name, type: 'city' }];
      } else {
        province.cities.push({ code, name, type: 'city' });
      }
    } else {
      const provinceCode = Math.floor(code / 10000) * 10000;
      let cityCode = Math.floor(code / 100) * 100;
      const province = provinces.find(({ code }) => code === provinceCode);

      if (!province.cities) {
        cityCode = provinceCode + 100;
        province.cities = [{
          code: cityCode,
          name: province.name,
        }];
      }
      const city = province.cities.find(({ code }) => code === cityCode);
      if (!city) {
        if (!province.counties) {
          province.counties = [{ code, name, type: 'county' }];
        } else {
          province.counties.push({ code, name, type: 'county' });
        }
        continue;
      } 
      if (!city.counties) {
        city.counties = [{ code, name, type: 'county' }];
      } else {
        city.counties.push({ code, name, type: 'county' });
      }
    }
  }
  fs.writeFileSync('administrative-division-china.json', JSON.stringify({
    provinces
  }, null, 2));
});
