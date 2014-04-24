module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: ['src/json2.js', 'src/logger.js'],
                dest: 'tmp/<%= pkg.name %>.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['tmp/<%= pkg.name %>.js'],
                dest: 'build/<%= pkg.name %>.min.js'
            }
        },
        clean: {
            tmp: ["tmp"]
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['clean:tmp', 'concat', 'uglify', 'clean:tmp']);
};