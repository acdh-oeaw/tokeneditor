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

var docs = [];
var doc = {};
var token = {};
var tokenCount = 0;
var pageSize = 1000;

function propSave() {
    var name = $(this).attr('data-value');
    var prop;
    $.each(doc.properties, function (key, value) {
        if (value.name === name) {
            prop = value;
        }
    });

    var param = {
        document_id: doc.documentId,
        token_id: token.token_id,
        name: prop.name,
        value: $(this).val()
    };
    var parent = $(this).parent();
    parent.addClass('has-warning');
    $.post('storejson.php', param, function (data) {
        data = JSON.parse(data);
        if (data.status && data.status === 'OK') {
            parent.removeClass('has-warning');
        }
    });
}

function documentsGet() {
    $.getJSON('document', documentsDisplay);
}

function documentsDisplay(data) {
    var list = $('#documentId');
    docs = data.data;
    list.html('');
    $.each(docs, function (key, value) {
        list.append('<option value="' + key + '">' + value.name + ' (' + value.tokenCount + ')</option>');
        $.each(value.properties, function (key, value) {
            value.widget = widgetFactory(value);
        });
        if (doc && doc.documentId == value.documentId) {
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
        }else{
            node.remove();
        }
    });

    $('#exportInPlace')
            .attr('href', 'document/' + encodeURIComponent(doc.documentId) + '?inPlace=1')
            .attr('target', '_blank');
    $('#exportEnriched')
            .attr('href', 'document/' + encodeURIComponent(doc.documentId))
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
    var url = 'document/' + encodeURIComponent(doc.documentId) + '/token';
    var param = {
        _offset: pageSize * (parseInt($('#pageNo').val()) - 1),
        _pagesize: pageSize
    };
    param = getFilterParam(param);
    $.get(url, param, indexDisplay);
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

    if (data.data.length === 0) {
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
    var param = {
        _docid: doc.documentId,
        _offset: parseInt($('#tokenNo').val()) - 1,
        _pagesize: 1
    };
    param = getFilterParam(param);
    $.get('generatejson.php', param, tokenDisplay);
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

function importHandle(data) {
    var message;
    var helperClass;
    var s = $('#importResult');
    if (data && data.status && data.status === 'OK') {
        message = 'import successful';
        helperClass = 'text-success';
    } else {
        message = 'import failed: ' + data.message;
        helperClass = 'text-danger';
    }
    s.removeClass('text-success')
            .removeClass('text-danger')
            .addClass(helperClass)
            .text(message);
    if (data && data.status && data.status === 'OK') {
        var s = $('#documentId').get(0);
        doc.documentId = data.documentId;
        documentsGet();
    }
}

$().ready(function () {
    documentsGet();

    new TokenEditorImporter($('#import').get(0), 'document', importHandle);

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
