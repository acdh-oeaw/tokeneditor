/* 
 * Copyright (C) 2016 zozlak
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

Link = function (prop, readOnly) {
    var that = this;

    this.prop = prop;
    this.readOnly = readOnly | false;

    this.draw = function (value, readOnly) {
        if (readOnly || that.readOnly) {

            var aelement = $(document.createElement("a"));
            value = (that.prop.values[0] ? that.prop.values[0] : '') + value;
            aelement.text(value);
            aelement.attr("href", value);
            aelement.attr("target", '_blank');
            return aelement;
        }
        var inp = $(document.createElement('input'));
        inp.attr('data-value', that.prop.name);
        inp.attr('type', 'url');
        inp.addClass('form-control');
        inp.val(value);
        return inp;
    };

    this.search = function(){
        var inp = $(document.createElement('input'));
        inp.attr('data-value', that.prop.name);
        inp.attr('type', 'url');
        inp.addClass('string');
        inp.addClass('form-control');
        return inp;        
    };
    
    this.registerInGrid = function(scope){

        return {
            field:                that.prop.name,
            cellTemplate:         that.getCellTemplate(scope, true),
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate: that.getEditableCellTemplate('ui-grid-editor'),
            enableCellEdit:       that.readOnly
        };

    };
};
Link.prototype = WidgetBaseClass;
