const translate = require('@vitalets/google-translate-api');
var googleTranslate = require('google-translate')("AIzaSyDdg6DtDCEdjFuOmDUuTz1Gg8NOX0xbotY");
const tunnel = require('tunnel');
const jsonfile = require('jsonfile');
const jsonUtils = require('my-json-utils');
const { alphaJson } = require('my-json-utils');
const { addAlphaJson } = require('my-json-utils');

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
        const textValues = Object.values(data);
        googleTranslate.translate(textValues, language, function(err, translations) {
            resolveOuter(translations);
            if (err) {
                console.error(err);
            }
            // =>  es
          });
        
    });
}
jsonfile.readFile('./data/new-data.json', function (err, data) {

    const keyMap = Object.keys(data).reduce((acc, key) => {
        return {
            ...acc,
            [data[key]]: key
        };
    }, {});

    const translatedObjs = languages.map((lang) => translateFn(data, !!lang.code ? lang.code : lang.lang));

    Promise.all(translatedObjs).then((langData) => {


        // google-translate api

        const transData = langData.map((languageTranslations, index) => {
            const language = languages[index];
            const translations = languageTranslations.reduce((acc, trans) => {
                return {
                    ...acc,
                    [keyMap[trans.originalText]]: trans.translatedText
                }
            }, {});
            return {
                language,
                translations
            };
        })

        transData.forEach((transJsn) => {
            jsonUtils.addJson(transJsn.language.file, transJsn.translations);
            // jsonfile.writeFile(transJsn.language.file, transJsn.translations, function (err) {
            //     if (err) {
            //         console.error(err)
            //     } else {
            //         const transLength = Object.keys(transJsn.translations).length;
            //         console.log(`${transLength} translations written to ${transJsn.language.file}`);
            //         jsonUtils.updateAlphaJson(transJsn.language.file, transJsn.language.file);
            //     }
            //   });
        })
    }).catch((err) => console.error(err));
  
  });