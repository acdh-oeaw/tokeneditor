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

ClosedList = function (prop, readOnly) {
    var that = this;

    this.prop = prop;
    this.readOnly = readOnly | false;

    this.draw = function (value, readOnly) {
        if (readOnly || that.readOnly) {
            return $(document.createTextNode(value));
        }
        var sel = $(document.createElement('select'));
        sel.attr('data-value', that.prop.name);
        sel.addClass('form-control');
        that.fillWithOptions(sel.get(0));
        sel.val(value);
        return sel;
    };

    this.search = function () {
        var sel = $(document.createElement('select'));
        sel.attr('data-value', that.prop.name);
        sel.addClass('form-control');
        that.fillWithOptions(sel.get(0), true);
        return sel;
    };

    this.fillWithOptions = function (sel, addEmpty) {
        var hasEmpty = false;
        $.each(that.prop.propertyValues, function (key, value) {
            hasEmpty = hasEmpty || value.value === '';
        });
        if (addEmpty && !hasEmpty) {
            sel.add(new Option(''));
        }
        $.each(that.prop.propertyValues, function (key, value) {
            sel.add(new Option(value.value));
        });
    };

    this.registerInGrid = function (scope) {

        return {
            field: that.prop.name,
            cellTemplate: that.getCellTemplate(scope),
            filterHeaderTemplate: that.getFilterHeaderTemplate(),
            editableCellTemplate: that.getEditableCellTemplate('ui-grid-edit-dropdown'),
            enableCellEdit: !that.readOnly
        };
    };
};
ClosedList.prototype = WidgetBaseClass;

