<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

namespace util\rest;

/**
 * Description of HTTPContoller
 *
 * @author zozlak
 */
class HTTPContoller {

    static private $debug = false;

    static public function HTTPCode($msg = 'Internal Server Error', $code = 500) {
        $msg = explode("\n", $msg);
        header('HTTP/1.1 ' . $code . ' ' . trim($msg[0]));
    }

    static public function unauthorized($msg = 'Unauthorized') {
        self::HTTPCode($msg, 401);
    }

    static public function errorHandler($severity, $msg, $file, $line) {
        if (self::$debug) {
            $msg = sprintf('%s [%s:%s]: %s', $severity, $file, $line, $msg);
        }
        self::HTTPCode($msg, 500);
    }

    static public function setDebug($v) {
        self::$debug = $v ? true : false;
    }

    private $namespace;

    /**
     *
     * @var \util\FormatterInterface
     */
    private $formatter;
    private $constParams = array();

    public function __construct($namespace = '') {
        $this->namespace = '\\' . $namespace;
    }

    public function addParam($name, $value) {
        $this->constParams[$name] = $value;
    }

    public function handleRequest() {
        $this->parseAccept();

        // compose class and method from the request GET path parameter
        $path = explode('/', preg_replace('|/$|', '', filter_input(\INPUT_GET, 'path')));
        $params = new \stdClass();
        $handlerClass = '';
        foreach ($path as $key => $value) {
            if ($key % 2 == 0) {
                $handlerClass = $value;
            } else {
                $name = $handlerClass . 'Id';
                $params->$name = $value;
            }
        }

        foreach ($this->constParams as $key => $value) {
            $params->$key = $value;
        }

        $handlerClass = $this->namespace . '\\' . mb_strtoupper(mb_substr($handlerClass, 0, 1)) . mb_substr($handlerClass, 1);
        $handler = new $handlerClass($params);

        $handlerMethod = mb_strtolower(filter_input(\INPUT_SERVER, 'REQUEST_METHOD')) . (count($path) % 2 === 0 ? '' : 'Collection');
        try {
            $handler->$handlerMethod($this->formatter);
            $this->formatter->end();
        } catch (\BadMethodCallException $e) {
            self::HTTPCode($e->getMessage(), 501);
        } catch (UnauthorizedException $e) {
            self::HTTPCode($e->getMessage(), 401);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $code = $code >= 400 && $code <= 418 || $code == 451 || $code >= 500 && $code <= 511 ? $code : 500;
            self::HTTPCode($e->getMessage(), $code);
        }
    }

    private function parseAccept() {
        // at the moment only JSON is suported but it shows how you can add others
        $accept = trim(filter_input(\INPUT_SERVER, 'HTTP_ACCEPT'));
        if ($accept != '') {
            $tmp = explode(',', $accept);
            $accept = array();
            foreach ($tmp as $i) {
                $accept[trim($i[0])] = count($i) > 1 ? floatval($i[1]) : 1;
            }
            arsort($accept);
            foreach ($accept as $k => $v) {
                switch ($k) {
                    default:
                        $this->formatter = new JSONFormatter();
                        break 2;
                }
            }
        } else {
            $this->formatter = new JSONFormatter();
        }
    }

}
