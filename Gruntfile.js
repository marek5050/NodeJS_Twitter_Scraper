var excel_file='/Users/marekbejda/Desktop/TwitterStuffs/excel.xlsx';
var json_file='/Users/marekbejda/Desktop/TwitterStuffs/validJSON.json';

go:{
   options:{
        json:excel_file,
        excel:json_file,
        to:"excel",
        formating:true
    },
    dist:{}
}


grunt.loadNpmTasks('json.excel');

grunt.registerTask('default',['go']);
