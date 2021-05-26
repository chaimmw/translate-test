const translate = require('@vitalets/google-translate-api');
var googleTranslate = require('google-translate')("AIzaSyDdg6DtDCEdjFuOmDUuTz1Gg8NOX0xbotY");
const tunnel = require('tunnel');
const jsonfile = require('jsonfile');
const jsonUtils = require('my-json-utils');

const languages = [
    {lang: 'en_US', file: './data/en_US.json', code: 'en'},
    // {lang: 'en_GB', file: './data/en_GB.json'},
    {lang: 'fr', file: './data/fr.json'},
    {lang: 'ko', file: './data/ko.json'},
    {lang: 'pt_PT', file: './data/pt_PT.json', code: 'pt'},
    {lang: '_jp', file: './data/_jp.json', code: 'ja'},
    {lang: 'de', file: './data/de.json'},
    {lang: 'es', file: './data/es.json'},
    {lang: 'zh-CN', file: './data/zh_CN.json'}, 
];

function translateFn(data, language) {
    return new Promise((resolveOuter, reject) => {

        //google-translate api
        // const textValues = Object.values(data);
        // googleTranslate.translate(textValues, language, function(err, translations) {
        //     console.log(translations);
        //     resolveOuter();
        //     if (err) {
        //         console.error(err);
        //     }
        //     // =>  es
        //   });

        // vitalets api
        
        const transValues = Object.keys(data);
        const slicedValues = transValues.slice(0, 10);
        const promisesMap = slicedValues.map((key) => ({
            key,
            req: translate(data[key], {to: language}, {
                agent: tunnel.httpsOverHttp({
                proxy: { 
                  host: '3.89.193.119',
                  port: '80',
                  proxyAuth: 'decisionlink:Proxy123',
                  headers: {
                    'User-Agent': 'Node'
                  }
                }
              })
            }
            ),
            word: data[key]
        }));
        const promiseKeyMap = promisesMap.map((metaData) => {
            return new Promise((resolve, reject) => {
                metaData.req.then((translationObject) => {
                    resolve({
                        key: metaData.key,
                        word: metaData.word,
                        translation: translationObject.text,
                        language
                    })
                }).catch((err) => console.error(err))
            })
        })
        Promise.all(promiseKeyMap).then((transObj) => {
            resolveOuter(transObj);
        }).catch((err) => console.error(err));
        
    });
}
jsonfile.readFile('./data/en.json', function (err, data) {

    const keyMap = Object.keys(data).reduce((acc, key) => {
        return {
            ...acc,
            [data.key]: key
        };
    }, {});

    const translatedObjs = languages.map((lang) => translateFn(data, !!lang.code ? lang.code : lang.lang));

    Promise.all(translatedObjs).then((langData) => {


        // google-translate api

        // const transData = langData.map((languageTranslations, index) => {
        //     const language = languages[0];
        //     const translations = languageTranslations.reduce((acc, trans) => {
        //         return {
        //             ...acc,
        //             [keyMap[trans.originalText]]: trans.translatedText
        //         }
        //     }, {});
        //     return {
        //         language,
        //         translations
        //     };
        // })
        // @vitalets api
        
        const jsonData = langData.map((translations) => {
            let transLang;
            const jsonObj = translations.reduce((acc, curr) => {
                transLang = curr.language;
                return {
                    ...acc,
                    [curr.key]: curr.translation
                };
            }, {});
            const langMeta = languages.find((lang) => lang.lang === transLang || lang.code === transLang);
            return {
                file: langMeta.file,
                obj: jsonObj
            }
        });
        jsonData.forEach((transJsn) => {
            jsonfile.writeFile(transJsn.file, transJsn.obj, function (err) {
                if (err) {
                    console.error(err)
                } else {
                    const transLength = Object.keys(transJsn.obj).length;
                    console.log(`${transLength} translations written to ${transJsn.file}`);
                    jsonUtils.updateAlphaJson(transJsn.file, transJsn.file);
                }
              });
        })
    }).catch((err) => console.error(err));
  
  });