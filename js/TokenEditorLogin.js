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
    var loggedIn = false;
    var login = null;
    var shibboleth = false;
    var errorHandles = [];
    var loginHandles = [];
    var logoutHandles = [];

    // private

    var loginGoogle = function () {
        var c = config.google;
        var url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                'scope=email' +
                '&response_type=code' +
                '&redirect_uri=' + encodeURIComponent(location.origin + location.pathname) +
                (c.accessType ? '&access_type=' + encodeURIComponent(c.accessType) : '') +
                '&client_id=' + encodeURIComponent(c.clientId);
        location = url;
    };

    var loginShibboleth = function () {
        var c = config.shibboleth;
        var url = c.loginUrl +
                '?target=' + encodeURIComponent(location.origin + location.pathname) +
                (c.entityId ? '&entityID=' + encodeURIComponent(c.entityId) : '');
        location = url;
    };

    var loginBasic = function () {
        var c = config.basic;
        getToken($(c.login).val(), $(c.password).val());
    };

    var triggerHandles = function (handles) {
        for (var i = 0; i < handles.length; i++) {
            handles[i]();
        }
    };

    var getToken = function (username, password) {
        username = username || '__dummy_user__';
        password = password || '';
        $.ajax({
            url: config.tokenEditorApiUrl + '/editor/current',
            username: username,
            password: password,
            method: 'GET',
            success: function (data) {
                console.log['current user', data];
                document.cookie = 'token=' + data.token + '; path=/';
                login = data.login;
                shibboleth = data.shibboleth;
                triggerHandles(loginHandles);

                if (username && password) {
                    $.ajax({
                        url: config.tokenEditorApiUrl + '/editor/current',
                        username: '__dummy_user__',
                        password: '',
                        method: 'GET',
                    });
                }
            },
            error: function (a, b, c) {
                console.log(['login error', a, b, c]);
                triggerHandles(errorHandles);
            }
        });
    };

    // public

    this.login = function (method) {
        that.logout(true);
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

    this.logout = function (skipHandles) {
        document.cookie = 'googleToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
        if (shibboleth) {
            location = config.shibboleth.logoutUrl;
            return;
        }
        if (!skipHandles) {
            if (config.basic.password) {
                $(config.basic.password).val('');
            }
            triggerHandles(logoutHandles);
        }
    };

    this.onError = function (f) {
        errorHandles.push(f);
    };

    this.onLogin = function (f) {
        loginHandles.push(f);
    };

    this.onLogout = function (f) {
        logoutHandles.push(f);
    };

    this.isLoggedIn = function () {
        return login != null;
    };

    this.getLogin = function () {
        return login;
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
                    redirect_uri: location.origin + location.pathname,
                    grant_type: 'authorization_code'
                },
                success: function (data) {
                    document.cookie = 'googleToken=' + data.access_token + '; path=/';
                    getToken();
                }
            };
            $.ajax(request);
        } else {
            getToken();
        }
    };

    // constructor
};
