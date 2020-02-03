app.directive('uiGridEditorTypeahead',
  ['gridUtil', 'uiGridConstants', 'uiGridEditConstants', '$timeout', 'uiGridEditService',
    function (gridUtil, uiGridConstants, uiGridEditConstants, $timeout, uiGridEditService) {
      return {
        scope: true,
        require: ['?^uiGrid', '?^uiGridRenderContainer', 'ngModel'],
        compile: function () {
          return {
            pre: function ($scope, $elm, $attrs) {

            },
            post: function ($scope, $elm, $attrs, controllers) {
              var uiGridCtrl, renderContainerCtrl, ngModel;
              if (controllers[0]) { uiGridCtrl = controllers[0]; }
              if (controllers[1]) { renderContainerCtrl = controllers[1]; }
              if (controllers[2]) { ngModel = controllers[2]; }

              // expected behavior:
              // 1. BEGIN_CELL_EDIT by cellNav or click
              // 2. navigate/select typeahead by keydown or mouse
              // 3. back to input box after typeahead selected
              // 4. END_CELL_EDIT by cellNav
              $scope.isTypeaheadOpen = false;
              $scope.isTypeaheadSelected = false;
              $scope.onTypeaheadSelect = function (entity, field, item) {
                $scope.isTypeaheadSelected = true;
                entity[field] = item;
                console.log(entity[field]);
                // after typeahead selected by click, move cursor to the end of text
                $elm[0].focus();
                $elm[0].value = item;
              };

              //set focus at start of edit
              $scope.$on(uiGridEditConstants.events.BEGIN_CELL_EDIT, function (evt, triggerEvent) {
                $timeout(function () {
                  $elm[0].focus();
                  //only select text if it is not being replaced below in the cellNav viewPortKeyPress
                  if ($elm[0].select && ($scope.col.colDef.enableCellEditOnFocus || !(uiGridCtrl && uiGridCtrl.grid.api.cellNav))) {
                    $elm[0].select();
                  }
                  else {
                    //some browsers (Chrome) stupidly, imo, support the w3 standard that number, email, ...
                    //fields should not allow setSelectionRange.  We ignore the error for those browsers
                    //https://www.w3.org/Bugs/Public/show_bug.cgi?id=24796
                    try {
                      $elm[0].setSelectionRange($elm[0].value.length, $elm[0].value.length);
                    }
                    catch (ex) {
                      //ignore
                    }
                  }
                  $scope.$watch('isTypeaheadOpen', function (newValue, oldValue) {
                    if (newValue === oldValue) { return; }
                    // handle typeahead select by click
                    if (newValue === true) {
                      // when typeahead popup opened, ready to handle click
                      $elm.off('blur', $scope.stopEdit);
                      var typeaheadPopupElm = angular.element(document).find('[uib-typeahead-popup]');
                      typeaheadPopupElm.on('click', function (evt) {
                        typeaheadPopupElm.off('click');
                        $scope.isTypeaheadSelected = false;
                      });
                    } else {
                      // when typeahead popup closed, back to normal behavior
                      $elm.on('blur', $scope.stopEdit);
                    }
                  });
                });

                //set the keystroke that started the edit event
                //we must do this because the BeginEdit is done in a different event loop than the intitial
                //keydown event
                //fire this event for the keypress that is received
                if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
                  var viewPortKeyDownUnregister = uiGridCtrl.grid.api.cellNav.on.viewPortKeyPress($scope, function (evt, rowCol) {
                    if (uiGridEditService.isStartEditKey(evt)) {
                      var code = typeof evt.which === 'number' ? evt.which : evt.keyCode;
                      if (code > 0) {
                        ngModel.$setViewValue(String.fromCharCode(code), evt);
                        ngModel.$render();
                      }
                    }
                    viewPortKeyDownUnregister();
                  });
                }

                // macOS will blur the checkbox when clicked in Safari and Firefox,
                // to get around this, we disable the blur handler on mousedown,
                // and then focus the checkbox and re-enable the blur handler after $timeout
                $elm.on('mousedown', function (evt) {
                  if ($elm[0].type === 'checkbox') {
                    $elm.off('blur', $scope.stopEdit);
                    $timeout(function () {
                      $elm[0].focus();
                      $elm.on('blur', $scope.stopEdit);
                    });
                  }
                });

                $elm.on('blur', $scope.stopEdit);
              });


              $scope.deepEdit = false;

              $scope.stopEdit = function (evt) {
                if ($scope.inputForm && !$scope.inputForm.$valid) {
                  evt.stopPropagation();
                  $scope.$emit(uiGridEditConstants.events.CANCEL_CELL_EDIT);
                }
                else {
                  $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
                }
                $scope.deepEdit = false;
              };


              $elm.on('click', function (evt) {
                if ($elm[0].type !== 'checkbox') {
                  $scope.deepEdit = true;
                  $timeout(function () {
                    $scope.grid.disableScrolling = true;
                  });
                }
              });

              $elm.on('keydown', function (evt) {
                switch (evt.keyCode) {
                  case uiGridConstants.keymap.ESC:
                    evt.stopPropagation();
                    $scope.$emit(uiGridEditConstants.events.CANCEL_CELL_EDIT);
                    break;
                }

                if ($scope.deepEdit &&
                  (evt.keyCode === uiGridConstants.keymap.LEFT ||
                    evt.keyCode === uiGridConstants.keymap.RIGHT ||
                    evt.keyCode === uiGridConstants.keymap.UP ||
                    evt.keyCode === uiGridConstants.keymap.DOWN)) {
                  evt.stopPropagation();
                }
                // Pass the keydown event off to the cellNav service, if it exists
                else if (uiGridCtrl && uiGridCtrl.grid.api.cellNav) {
                  var skipHandleKeyDown = false;
                  switch (evt.keyCode) {
                    case uiGridConstants.keymap.UP:
                    case uiGridConstants.keymap.DOWN:
                      if ($scope.isTypeaheadOpen) {
                        // skip default behavior when using typeahead
                        skipHandleKeyDown = true;
                      }
                      break;
                    case uiGridConstants.keymap.ENTER:
                      if ($scope.isTypeaheadSelected) {
                        // after typeahead selected, back to input box
                        $scope.isTypeaheadSelected = false;
                        skipHandleKeyDown = true;
                      }
                      break;
                    default:
                  }
                  evt.uiGridTargetRenderContainerId = renderContainerCtrl.containerId;
                  if (!skipHandleKeyDown) {
                    if (uiGridCtrl.cellNav.handleKeyDown(evt) !== null) {
                      $scope.stopEdit(evt);
                    }
                  }
                }
                else {
                  //handle enter and tab for editing not using cellNav
                  switch (evt.keyCode) {
                    case uiGridConstants.keymap.ENTER: // Enter (Leave Field)
                    case uiGridConstants.keymap.TAB:
                      evt.stopPropagation();
                      evt.preventDefault();
                      $scope.stopEdit(evt);
                      break;
                  }
                }

                return true;
              });

              $scope.$on('$destroy', function unbindEvents() {
                // unbind all jquery events in order to avoid memory leaks
                $elm.off();
              });
            }
          };
        }
      };
    }
  ]
).directive('customautocomplete', ['$document', 'uiGridEditConstants',
    function uiSelectWrap($document, uiGridEditConstants) {
      return function link($scope, $elm, $attr) {
        $document.on('click', docClick);

        function docClick(evt) {
          if ($(evt.target).closest('.ui-select-container').length === 0) {
            $scope.$emit(uiGridEditConstants.events.END_CELL_EDIT);
            $document.off('click', docClick);
          }
        }
      };
    }]);