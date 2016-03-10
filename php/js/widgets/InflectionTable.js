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

InflectionTable = function (prop) {
    var that = this;

    this.prop = prop;

    this.rules = {
        nn: {
            NomSg: /nom_sg"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            GenSg: /gen_sg"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            DatSg: /dat_sg(_old)?"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            AccSg: /acc_sg"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            NomPl: /nom_pl"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            GenPl: /gen_pl"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            DatPl: /dat_pl"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            AccPl: /acc_pl"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g
        },
        adj: {
            PosAdv: /pos_adv"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            CompAdv: /comp_adv"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            Sup: /sup"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g
        },
        v: {
            'Inf': /inf"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            '1SgPresInd': /1_sg_pres_ind"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            '2SgPresInd': /2_sg_pres_ind"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            '3SgPresInd': /3_sg_pres_ind"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            '1SgPastInd': /1_sg_past_ind"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g,
            'PPast': /ppast"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g
        },
        adv: {
            Adv: /adv"[^>]+>[^<]*<orth>([^<]*)<\/orth>/g
        }
    };
    this.rules.abbr = this.rules.nn;
    this.rules.nprop = this.rules.nn;

    this.templates = {
        nn: '<table class="inflectionTable">' +
                '<thead><tr><th></th><th>Singular</th><th>Plural</th></tr></thead>' +
                '<tbody>' +
                '<tr><td class="header">Nom</td><td>%NomSg%</td><td>%NomPl%</td></tr>' +
                '<tr><td class="header">Gen</td><td>%GenSg%</td><td>%GenPl%</td></tr>' +
                '<tr><td class="header">Dat</td><td>%DatSg%</td><td>%DatPl%</td></tr>' +
                '<tr><td class="header">Acc</td><td>%AccSg%</td><td>%AccPl%</td></tr>' +
                '</tbody>' +
                '</table>',
        adj: '<table class="inflectionTable">' +
                '<tbody>' +
                '<tr><td class="header">Pos Adv</td><td>%PosAdv%</td></tr>' +
                '<tr><td class="header">Comp Adv</td><td>%CompAdv%</td></tr>' +
                '<tr><td class="header">Sup</td><td>%Sup%</td></tr>' +
                '</tbody>' +
                '</table>',
        v: '<table class="inflectionTable">' +
                '<tbody>' +
                '<tr><td class="header">Inf</td><td>%Inf%</td></tr>' +
                '<tr><td class="header">1 Sg Pres Ind</td><td>%1SgPresInd%</td></tr>' +
                '<tr><td class="header">2 Sg Pres Ind</td><td>%2SgPresInd%</td></tr>' +
                '<tr><td class="header">3 Sg Pres Ind</td><td>%3SgPresInd%</td></tr>' +
                '<tr><td class="header">1 Sg Past Ind</td><td>%1SgPastInd%</td></tr>' +
                '<tr><td class="header">PPast</td><td>%PPast%</td></tr>' +
                '</tbody>' +
                '</table>',
        adv: '<table class="inflectionTable">' +
                '<tbody>' +
                '<tr><td class="header">Adv</td><td>%Adv%</td></tr>' +
                '</tbody>' +
                '</table>'
    };
    this.templates.abbr = this.templates.nn;
    this.templates.nprop = this.templates.nn;

    this.draw = function (value, readOnly) {
        var template;
        var pos;
        // strip new lines so that our regexp work in a predictable way
        value = value.replace(/[\n\r]/gm, '');
        try{
            pos = /ana="#([a-z]+)/.exec(value)[1];
        }catch(e){}
        if (!pos || !that.templates[pos] || !that.rules[pos]) {
            template = 'no inflection table template for "' + pos + '"';
        }else{
            template = that.templates[pos];
            $.each(that.rules[pos], function (key, rule) {
                var forms = '';
                var s;
                while ((s = rule.exec(value))) {
                    var tmp = s[s.length - 1];
                    if (tmp !== 'no result') {
                        forms += tmp;
                        var freq = new RegExp(rule.source + '.*?<measure quantity="([0-9]+)" commodity="tokens" type="absolute"').exec(value);
                        if (freq) {
                            forms += ' (' + freq[freq.length - 1] + ')';
                        }
                        forms += '<br/>';
                    } else if (forms === '') {
                        forms += '-<br/>';
                    }
                }

                template = template.replace('%' + key + '%', forms);
            });
        }
        return $(document.createElement('div')).html(template);
    };

    this.search = function () {
        return null;
    };

    this.registerInGrid = function(scope){
        return {
            field:                that.prop.name,
            cellTemplate:         that.getCellTemplate(scope, true),
            filterHeaderTemplate: '',
            editableCellTemplate: '',
            enableCellEdit:       false,
            enableFiltering:      false
        };
    };
};
InflectionTable.prototype = WidgetBaseClass;
