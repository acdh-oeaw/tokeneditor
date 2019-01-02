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

var loginConfig;
var apiBase;

var docs = [];
var doc = {};
var token = {};
var tokenCount = 0;
var pageSize = 1000;
var userLogin;

function propSave() {
    var name = $(this).attr('data-value');
    var prop;
    $.each(doc.properties, function (key, value) {
        if (value.name === name) {
            prop = value;
        }
    });

    var value = $(this).val();
    if ($(this).attr('type') === 'checkbox') {
        value = $(this).prop('checked');
    }

    var parent = $(this).parent();
    parent.addClass('has-warning');
    $.ajax({
        url: apiBase + '/document/' + encodeURIComponent(doc.documentId) + '/token/' + encodeURIComponent(token.tokenId),
        method: 'PUT',
        data: {
            name: prop.name,
            value: value
        },
        success: function (data) {
            parent.removeClass('has-warning');
        },
        error: ajaxError
    });
}

function documentsGet() {
    $.ajax({
        url: apiBase + '/document',
        success: documentsDisplay,
        error: ajaxError
    });
}

function ajaxError(jqXHR, status, error) {
    console.log(jqXHR);
    console.log(status);
    console.log(error);

    $('#indexWait').hide();
    $('#tokenForm').html();
    
    if (jqXHR.status === 401) {
        alert('session expired, log in again');
    }
}

function documentsDisplay(data) {
    docs = data;
    var list = $('#documentId');
    list.html('');
    $.each(docs, function (key, value) {
        list.append('<option value="' + key + '">' + value.name + ' (' + value.tokenCount + ')</option>');
        $.each(value.properties, function (key, value) {
            value.widget = widgetFactory(value);
        });
        if (doc && doc.documentId === value.documentId) {
            list.val(key);
        }
    });
    if (docs.length > 0) {
        list.change();
    }
}

function documentDisplay() {
    doc = docs[$(this).val()];

    $('#search input[type="number"]:first').attr('max', doc.tokenCount);
    var search = $('#filters');
    search.empty();
    $.each(doc.properties, function (key, value) {
        search.append(
                '<div class="input-group">' +
                '<div class="input-group-addon"></div>' +
                '<span></span>' +
                '</div>'
                );
        var node = search.find('div.input-group').last();
        node.find('.input-group-addon').text(value.name);
        var ret = value.widget.search();
        if (ret) {
            node.find('span').append(ret);
        } else {
            node.remove();
        }
    });

    $('#exportXml')
            .attr('href', apiBase + '/document/' + encodeURIComponent(doc.documentId) + '?_format=text/xml&inPlace=1')
            .attr('target', '_blank');
    $('#exportXmlFull')
            .attr('href', apiBase + '/document/' + encodeURIComponent(doc.documentId) + '?_format=text/xml')
            .attr('target', '_blank');
    $('#exportCsv')
            .attr('href', apiBase + '/document/' + encodeURIComponent(doc.documentId) + '?_format=text/csv')
            .attr('target', '_blank');
    $('#exportJson')
            .attr('href', apiBase + '/document/' + encodeURIComponent(doc.documentId) + '?_format=application/json&inPlace=1')
            .attr('target', '_blank');
    $('#exportJsonFull')
            .attr('href', apiBase + '/document/' + encodeURIComponent(doc.documentId) + '?_format=application/json')
            .attr('target', '_blank');

    tokenGet();
    indexGet();
}

function getFilterParam(param) {
    $('#search').find('input, select').each(function () {
        var val = $(this).val();
        if (val !== '') {
            param[$(this).attr('data-value')] = val;
        }
    });
    return param;
}

function indexGet() {
    $.ajax({
        url: apiBase + '/document/' + encodeURIComponent(doc.documentId) + '/token',
        data: getFilterParam({
            _offset: pageSize * (parseInt($('#pageNo').val()) - 1),
            _pageSize: pageSize,
            _tokensOnly: 1
        }),
        success: indexDisplay,
        error: ajaxError
    });
    $('#indexWait').show();
    $('#indexPanel > dl').empty();
    $('#tokensFound').empty();
}

function indexDisplay(data) {
    var maxPage = Math.ceil(data.tokenCount / pageSize);
    var helpText = '/ ' + maxPage + ' (' + data.tokenCount + ' tokens)';
    $('#pageNo').parent().find('.input-group-addon').text(helpText);
    $('#pageNo').prop('max', maxPage);

    var c = $('#indexPanel > dl');
    $('#indexWait').hide();

    if (data.length === 0) {
        c.html('<dt></dt><dd>No tokens found</dd>');
        return;
    }

    c.empty();
    $.each(data.data, function (key, value) {
        var tmp = $(document.createElement('dt'));
        tmp.text(value.tokenId);
        c.append(tmp);

        tmp = $(document.createElement('dd'));
        tmp.html('<a href="#"></a>');
        tmp.find('a')
                .attr('data-value', key + 1)
                .text(value.token);
        c.append(tmp);
    });

    var p = $('#indexPanel ul.pagination');
    p.empty();
    for (var i = 1; i < Math.ceil(data.tokenCount / pageSize); i++) {
        p.append('<li><a href="#">' + i + '</a></li>');
    }
}

function tokenGet() {
    $.ajax({
        url: apiBase + '/document/' + encodeURIComponent(doc.documentId) + '/token',
        data: getFilterParam({
            _docid: doc.documentId,
            _offset: parseInt($('#tokenNo').val()) - 1,
            _pageSize: 1
        }),
        success: tokenDisplay,
        error: ajaxError
    });
    $('#tokenForm').html('<i class="fa fa-refresh fa-spin fa-2x"></i>');
}

function tokenDisplay(data) {
    var c = $('#tokenForm');
    tokenCount = data.tokenCount;
    $('#tokenNo').parent().find('.input-group-addon').text('/ ' + tokenCount);
    $('#tokenNo').prop('max', tokenCount);

    if (data.data.length === 0) {
        c.html(
                '<div class="panel panel-default">' +
                '<div class="panel-heading"></div>' +
                '<div class="panel-body">No such tokens</div>' +
                '</div>'
                );
        $('#tokenNo').prop('max', 1);
        return;
    }

    token = data.data[0];

    c.empty();
    $.each(token, function (key, value) {
        var prop = doc.properties[key];
        if (!prop) {
            prop = {name: key, typeId: ''};
            prop.widget = widgetFactory(prop);
        }
        c.append(
                '<div class="panel panel-default">' +
                '<div class="panel-heading">' + prop.name + '</div>' +
                '<div class="panel-body"></div>' +
                '</div>'
                );
        var w = prop.widget.draw(value);
        c.find('div:last-child div.panel-body').append(w);
        w.change(propSave);
    });
    c.find('select, input').focus();
}

function onImportFailure(jqXHR, status, error) {
    $('#importResult')
            .removeClass('text-success')
            .removeClass('text-danger')
            .addClass('text-danger')
            .text('import failed: ' + error);
}

function onImport(data) {
    $('#importResult')
            .removeClass('text-success')
            .removeClass('text-danger')
            .addClass('text-success')
            .text('import successful');
    doc.documentId = data.documentId;
    documentsGet();
}

$().ready(function () {
    userLogin = new TokenEditorLogin(loginConfig);
    userLogin.onLogin(documentsGet);
    userLogin.onLogout(function () {
        if (location === location.origin + location.pathname) {
            location.reload();
        } else {
            location = location.origin + location.pathname;
        }
    });
    userLogin.initialize();

    new TokenEditorImporter($('#import').get(0), apiBase + '/document', onImport, onImportFailure);

    $('#loginBasic').click(function () {
        userLogin.login('basic');
    });
    $('#loginGoogle').click(function () {
        userLogin.login('google');
    });
    $('#loginShibboleth').click(function () {
        userLogin.login('shibboleth');
    });
    $('#logout').click(function () {
        userLogin.logout();
    });

    $('#documentId').change(documentDisplay);
    $('#search').on('change', 'input, select', function () {
        $('#tokenNo').val(1);
        $('#pageNo').val(1);
        indexGet();
        tokenGet();
    });
    $('#indexPanel > dl').on('click', 'a', function () {
        var no = parseInt($(this).attr('data-value')) +
                (parseInt($('#pageNo').val()) - 1) * pageSize;
        $('#tokenNo').val(no);
        tokenGet();
        $('a[href="#tokenPanel"]').click();
    });

    $('#tokenNo').change(function () {
        var val = parseInt($('#tokenNo').val());
        if (val > $('#tokenNo').prop('max')) {
            $('#tokenNo').val($('#tokenNo').prop('max'));
        }
        if (val < 1) {
            $('#tokenNo').val(1);
        }
        tokenGet();
    });

    $('#goFirst').click(function () {
        $('#tokenNo').val(1);
        $('#tokenNo').change();
    });

    $('#goPrev').click(function () {
        $('#tokenNo').val(parseInt($('#tokenNo').val()) - 1);
        $('#tokenNo').change();
    });

    $('#goNext').click(function () {
        $('#tokenNo').val(parseInt($('#tokenNo').val()) + 1);
        $('#tokenNo').change();
    });

    $('#goLast').click(function () {
        $('#tokenNo').val($('#tokenNo').prop('max'));
        $('#tokenNo').change();
    });

    $('#pageNo').change(function () {
        var val = parseInt($('#pageNo').val());
        if (val > $('#pageNo').prop('max')) {
            $('#pageNo').val($('#pageNo').prop('max'));
        }
        if (val < 1) {
            $('#pageNo').val(1);
        }
        indexGet();
    });

    $('#pageFirst').click(function () {
        $('#pageNo').val(1);
        $('#pageNo').change();
    });

    $('#pagePrev').click(function () {
        $('#pageNo').val(parseInt($('#pageNo').val()) - 1);
        $('#pageNo').change();
    });

    $('#pageNext').click(function () {
        $('#pageNo').val(parseInt($('#pageNo').val()) + 1);
        $('#pageNo').change();
    });

    $('#pageLast').click(function () {
        $('#pageNo').val($('#pageNo').prop('max'));
        $('#pageNo').change();
    });
});
