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

WidgetClassName = function(prop, readOnly){
    //<-- This should stay untouched
    var that = this;

    this.prop = prop;
    this.readOnly = readOnly | false;
    //-->

    /** 
     * Returns DOM Node representing editable token property value
     * (or a text node if property is read only)
     * 
     * @param {string} value
     * @param {bool} readOnly enforce read only
     * @returns {object}
     */
    this.draw = function (value, readOnly) {
        if (readOnly || that.readOnly) {
            return $(document.createTextNode(value));
        }
        var inp = $(document.createElement('someHTMLelement'));
        inp.attr('data-value', that.prop.name);
        // add required attributes, etc. here
        inp.val(value);
        return inp;
    };

    /**
     * Returns DOM Node representing property's filter control.
     * 
     * @returns {object}
     */
    this.search = function(){
        var inp = $(document.createElement('someHTMLelement'));
        inp.attr('data-value', that.prop.name);
        // add required attributes, etc. here
        return inp;        
    };
        
    /**
     * Registers the widget in the UI-Grid.
     * It should return the column definition object with proper templates
     * and register in the scope all functions required by provided templates to
     * run.
     * You can use helper functions getCellTemplate(scope, html, function), 
     * getFilterHeaderTemplate()and getEditableCellTemplate(gridUiHandler) 
     * inherited from the WidgetBaseClass (see widgetFactory.js). In most cases 
     * they will return valid templates derived automatically from the search()
     * and draw() functions provided by you.
     * 
     * @param {object} scope available within the templates
     * @returns {object} column definition as described at https://github.com/angular-ui/ui-grid/wiki/Defining-columns
     */
    this.registerInGrid = function(scope){
        return {
            field:                that.prop.name,
            cellTemplate:         that.getCellTemplate(scope),
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate: that.getEditableCellTemplate('ui-grid-editor'),
            enableCellEdit:       !that.readOnly,
            enableFiltering:      true
        };
    };    
};
// DON'T FORGET TO UPDATE THIS ONE:
WidgetClassName.prototype = WidgetBaseClass;
