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

WidgetBaseClass = {
    prop: {},
    readOnly: true,
    functionNameCounter: 0,
    
    /**
     * To be implemented in derived class
     * Returns DOM Node representing property's filter control.
     * 
     * @returns {DOM Node}
     */
    search: function(){},
    
    /**
     * To be implemented in derived class
     * Returns DOM Node representing editable token property value
     * 
     * @param {String} value property value
     * @param {bool} readOnly enforce read only
     * @returns {DOM Node}
     */
    draw: function(value, readOnly){},
    
    /**
     * To be implemented in derived class
     * Registers the widget in the UI-Grid.
     * It should return the column definition object as described at
     * https://github.com/angular-ui/ui-grid/wiki/Defining-columns
     * 
     * @param {String} scope UI-Grid application scope
     * @returns {object} property column definition
     */
    registerInGrid: function(scope){},
    
    /**
     * Converts DOM Node into the string with HTML code
     * 
     * @param {type} element
     * @returns {unresolved}
     */
    toTemplate: function (element){
        return element.wrap('<div></div>').parent().html();
    },
    
    /**
     * Converts DOM Node returned by search() into a valid Grid-UI
     * filterHeaderTemplate by adding required attributes and surrounding
     * with a proper div container.
     * 
     * @returns {String}
     */
    getFilterHeaderTemplate: function(){
        var inp = this.search();
        inp.attr('data-value', this.prop.name);
        inp.attr('ng-model', 'colFilter.term');
        return '<div class="ui-grid-filter-container" ng-repeat="colFilter in col.filters">' + this.toTemplate(inp) + '<button ng-if="colFilter.term === null" type="button" ng-click="grid.appScope.resetColumnFilter(colFilter)" class="customfilterbutton p-1 mt-1 btn btn-sm btn-round">show all</button><button ng-if="colFilter.term !== null" type="button" ng-click="grid.appScope.showEmptyCells(colFilter)" class="customfilterbutton p-1 mt-1 btn btn-sm btn-round">filter empty cells</button></div>';
    },
    
    /**
     * Returns a valid Grid-UI cellTemplate.
     * 
     * It is also possible to apply a transformation function which will
     * convert raw token property value into string which should be presented
     * to the user. In such case, do not forget to register it in the Grid-UI
     * scope in the registerInGrid(scope) function.
     * 
     * @param {Object} scope Grid-UI scope
     * @param {bool} html should property value be interpreted as html (default false)
     * @param {function} f transformation function
     * @returns {String}
     */
    getCellTemplate: function(scope, html, f){
        var that = this;
        var fName = 'widgetBaseClassGetCellTemplate' + WidgetBaseClass.functionNameCounter;
        scope[fName] = function(value){
            return that.toTemplate(that.draw(value, true));
        };
        WidgetBaseClass.functionNameCounter++;
        f = f ? f : fName;
        if(html){
            return '<div class="ui-grid-cell-contents" title="TOOLTIP" ng-bind-html="' + (f ? 'grid.appScope.' + f + '(COL_FIELD)' : 'COL_FIELD') + '"></div>';
        }else{
            return '<div class="ui-grid-cell-contents" title="TOOLTIP">{{' + (f ? 'grid.appScope.' + f + '(COL_FIELD)' : 'COL_FIELD') + '}}</div>';
        }
    },
    
    /**
     * Converts DOM Node returned by draw() into a valid Grid-UI
     * filterHeaderTemplate by adding required attributes and surrounding
     * with a proper div container.
     * 
     * You must provide a right Grid-UI controller name which will check for
     * value changes and fire events when needed. For input and select
     * elements it would be, respectively, "ui-grid-editor" and
     * "ui-grid-edit-dropdown" (which are shipped with Grid-UI) and for other
     * elements you might have to provide them on your own.
     * 
     * @param {String} gridUiHandler Grid-UI controller name
     * @returns {String}
     */
    getEditableCellTemplate: function(gridUiHandler){
        if(this.readOnly){
            return '';
        }
        var inp = this.draw('');
        inp.attr('ng-class', "'colt' + col.uid");
        inp.attr('ng-model', 'MODEL_COL_FIELD');
        inp = this.toTemplate(inp);
        inp = inp.replace(/^<([a-z]+)/i, '$& ' + gridUiHandler + ' ');
        return '<div><form name="inputForm">' + inp + '</form></div>';
    }
};

/**
 * Returns the right widget object based on the object describing property
 * 
 * @param {object} prop object describing property
 * @returns {FreeText|InflectionTable|ClosedList}
 */
function widgetFactory(prop) {
    var widget;
    switch (prop.typeId) {
        case 'free text':
            widget = new FreeText(prop, prop.readOnly);
            break;
        case 'closed list':
            widget = new ClosedList(prop, prop.readOnly);
            break;
		case 'combobox':
            widget = new ComboBox(prop, prop.readOnly);
            break;
        case 'inflection table':
            widget = new InflectionTable(prop, prop.readOnly);
            break;
        case 'link':
            widget = new Link(prop, prop.readOnly);
            break;
		case 'boolean':
            widget = new Boolean(prop, prop.readOnly);
            break;	
        default:
            widget = new FreeText(prop, true);
    }
    return widget;
}