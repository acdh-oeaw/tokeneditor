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
    var errorHandles = [];
    var loginHandles = [];
    var logoutHandles = [];

    // private

    var loginGoogle = function () {
        var c = config.google;
        var url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
                'scope=email' +
                '&response_type=code' +
                '&redirect_uri=' + encodeURIComponent(window.location.origin + window.location.pathname) +
                (c.accessType ? '&access_type=' + encodeURIComponent(c.accessType) : '') +
                '&client_id=' + encodeURIComponent(c.clientId);
        window.location = url;
    };

    var loginShibboleth = function () {
        var c = config.shibboleth;
        var url = c.authUrl +
                '?target=' + encodeURIComponent(window.location.origin + window.location.pathname) +
                (c.entityId ? '&entityID=' + encodeURIComponent(c.entityId) : '');
        window.location = url;
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
        $.ajax({
            url: config.tokenEditorApiUrl + '/editor/current',
            username: username,
            password: password,
            method: 'GET',
            success: function (data) {
                console.log['current user', data];
                document.cookie = 'token=' + data.token + '; path=/';
                loggedIn = true;
                triggerHandles(loginHandles);
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
        if (!skipHandles) {
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
        return loggedIn;
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
