/*
 * Copyright (C) 2015 ACDH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


/**
 * 
 * Sample code for embeding TokenEditorIporter on you site:
 *  $().ready(function(){
 *      var tmp = new TokenEditorImporter(
 *          $('#myDivElement').get(0), 
 *          'http://127.0.0.1/tokeneditor/document',
 *          function(data){
 *              console.log(data);
 *          },
 *          function(jqXHR, status, error){
 *              console.log(error);
 *          }
 *      );
 *  });
 * 
 * @param {type} domElement DOM node in which import form should be created
 * @param {type} apiUrl API URL, typically https://clarin.oeaw.ac.at/tokenEditor/document
 * @param {type} callback function to be called on sucessful import
 * @returns {TokenEditorImporter}
 */
TokenEditorImporter = function (domElement, apiUrl, onSuccess, onError) {
    var that = this;
    this.dom = domElement;
    this.apiUrl = apiUrl;
    this.onSuccess = onSuccess;
    this.onError = onError;
    $(this.dom).html(
        '<form method="post" enctype="multipart/form-data">' +
            '<input type="hidden" name="MAX_FILE_SIZE" value="50200100"/>' +
            '<div class="form-group">' +
                '<label for="documentName">Document name</label> ' +
                '<input type="text" name="name" required="required" placeholder="Document name" class="form-control" id="documentName"/>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for"documentFile">Data file</label> ' +
                '<input type="file" name="document" accept="text/xml" required="required" class="" id="documentFile"/>' +
            '</div>' +
            '<div class="form-group">' +
                '<label for="documentSchema">Schema file</label> ' +
                '<input type="file" name="schema" accept="text/xml" required="required" class="" id="documentSchema"/>' +
            '</div>' +
            '<button type="submit" class="btn btn-primary">Import document</button>' +
            ' <span class="waitInd"></span>' +
        '</form>'
    );
    this.interval;
    this.step = 0;
    this.animate = function(){
        var s = 'importing data';
        for(var i = 0; i < that.step; i++){
            s += '.';
        }
        $(that.dom).find('span.waitInd').text(s);
        that.step = that.step > 2 ? 0 : that.step + 1;
    };
    $(this.dom).find('form').submit(function () {
        that.step = 0;
        that.interval = setInterval(that.animate, 1000);
        $(that.dom).find('button[type="submit"]').prop('disabled', true);
        $.ajax({
            url: that.apiUrl,
            type: 'POST',
            data: new FormData(this),
            processData: false,
            contentType: false,
            success: that.onSuccess,
            error: that.onError,
            complete: function(xhr, status){
                clearInterval(that.interval);
                $(that.dom).find('span.waitInd').empty();
                $(that.dom).find('button[type="submit"]').prop('disabled', false);                
            }
        });
        return false;
    });
};
