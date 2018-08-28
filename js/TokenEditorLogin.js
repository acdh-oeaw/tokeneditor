/*
 * Copyright (C) 2018 ACDH
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

TokenEditorLogin = function (config) {
    var that = this;
    var lastMethod = null;
    var login = null;
    var pswd = null;
    var googleToken = null;
    var loginHandlers = [];
    var logoutHandlers = [];

    // private

    var loginGoogle = function (c) {
        var url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                'scope=email' +
                '&response_type=code' +
                '&redirect_uri=' + encodeURIComponent(window.location.origin + window.location.pathname) +
                (c.accessType ? '&access_type=' + encodeURIComponent(c.accessType) : '') +
                '&client_id=' + encodeURIComponent(c.clientId);
        window.location = url;
    };

    var loginShibboleth = function (c) {
        var url = c.authUrl +
                '?target=' + encodeURIComponent(window.location.origin + window.location.pathname) +
                (c.entityId ? '&entityID=' + encodeURIComponent(c.entityId) : '');
        window.location = url;
    };

    var loginBasic = function (c) {
        login = $(c.login);
        password = $(c.password);
        triggerLoginHandlers();
    };

    var triggerLoginHandlers = function () {
        for (var i = 0; i < loginHandlers.length; i++) {
            loginHandlers[i]();
        }
    };

    // public

    this.login = function (method) {
        that.logout(true);
        method = method || lastMethod;
        console.log(['logging in', method, lastMethod]);
        lastMethod = method;
        switch (method) {
            case 'google':
                loginGoogle(config.google);
                break;
            case 'shibboleth':
                loginShibboleth(config.shibboleth);
                break;
            default:
                loginBasic(config.basic);
        }
    };

    this.logout = function (internal) {
        login = password = googleToken = '';
        document.cookie = "googleToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
        if (!internal) {
            for (var i = 1; i < logoutHandlers; i++) {
                logoutHandlers[i]();
            }
        }
    };

    this.sendRequest = function (request) {
        request.error = function (jqXHR, b, c) {
            console.log(['AJAX error', jqXHR, b, c]);
            if (jqXHR.status === 401 || jqXHR.status === 403) {
                console.log('handling login failure');
            }
        };
        if (login && password) {
            request.username = login.val();
            request.password = password.val();
        }
console.log(request);
        $.ajax(request);
    };

    this.onLogin = function (f) {
        loginHandlers.push(f);
    };

    this.onLogout = function (f) {
        logoutHandlers.push(f);
    };

    this.initialize = function () {
        var params = {};
        var query = location.search.substring(1);
        var regex = /([^&=]+)=([^&]*)/g;
        var i;
        while ((i = regex.exec(query)) || false) {
            params[decodeURIComponent(i[1])] = decodeURIComponent(i[2]);
        }

        // Google
        if (params.code) {
            var request = {
                url: 'https://www.googleapis.com/oauth2/v4/token',
                method: 'POST',
                data: {
                    code: params.code,
                    client_id: config.google.clientId,
                    client_secret: config.google.clientSecret,
                    redirect_uri: window.location.origin + window.location.pathname,
                    grant_type: 'authorization_code'
                },
                success: function (data) {
                    googleToken = data.access_token;
                    document.cookie = 'googleToken=' + data.access_token + '; path=/';
                    lastMethod = 'google';
                    console.log(['from api call', googleToken]);
                    triggerLoginHandlers();
                }
            };
            $.ajax(request);
        } else {
            googleToken = document.cookie.replace(/(?:(?:^|.*;\s*)googleToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            if (googleToken) {
                lastMethod = 'google';
                console.log(['from cookie', googleToken]);
            }
        }

        // Shiboleth
        var shibboleth = document.cookie.search(/_pk_ses[.]/) >=0 && document.cookie.search(/_pk_id[.]/) >=0;
        if (shibboleth) {
            lastMethod = 'shibboleth';
            console.log('shibboleth');
        }

        //
        if (googleToken || shibboleth || login && password) {
            triggerLoginHandlers();
        }
    };

    // constructor
};
