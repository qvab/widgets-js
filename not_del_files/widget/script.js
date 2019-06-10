define(['jquery'], function($) {
  var CustomWidget = function() {
    var w_code;
    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;
    var paramsLinerApp;
    var activeWidget = false;
    this.getServerUrl = function() {
      var serverUrl = server + '/linerapp/index.php';
      return serverUrl;
    };

    this.notifications = function(header, message, wait_time) {
      var inbox = $('#popups_inbox'),
          zIndex = inbox.css('z-index'),
          t = wait_time || 6000;

      AMOCRM.notifications.show_message_error({
        text: message || '', header: header || ''
      });
      inbox.css('z-index', 9001);
      setTimeout(function() {
        inbox.css('z-index', zIndex);
      }, t);
    };

    this.callbacks = {
      render: function() {
        return true;
      },

      init: function() {
        w_code = self.get_settings().widget_code;
        if (AMOCRM.widgets.list[w_code] != "undefined") {
          activeWidget = AMOCRM.widgets.list[w_code].params.widget_active == "Y" ? true : false;
        }
        if (activeWidget) {
          self.crm_post(
              server + '/modules/not_del_files.php?get',
              {
                login: AMOCRM.constant('user').login,
                hash: AMOCRM.constant('user').api_key,
                subdomain: AMOCRM.constant('account').subdomain
              },
              function(msg) {
                paramsLinerApp = msg;
                var currentUserID = AMOCRM.constant("user").id;
                setInterval(function() {
                  if (typeof paramsLinerApp.users != "undefined") {
                    var notBlockedUser = paramsLinerApp.users;
                    if (notBlockedUser[currentUserID] == 1) {
                      var w_code = self.get_settings().widget_code;
                      if (!( $('#linerapp-not_file_del').attr('id') || false )) {
                        $('head').append('<link type="text/css" rel="stylesheet"  id="linerapp-not_file_del" href="/' + w_code + '/widget/css/not_file_del.css" />');
                      }
                      $(".feed-note__joined-attach__item").parents(".feed-note-wrapper").find(".js-note-delete-btn").hide();
                      if ($(".js-note-attach-remove").length > 0) {
                        $(".js-note-attach-remove").remove();
                      }
                      if ($(".feed-note__joined-attach__item").parents(".feed-note-wrapper").find(".js-note-delete-btn").length > 0) {
                        $(".feed-note__joined-attach__item").parents(".feed-note-wrapper").find(".js-note-delete-btn").remove();
                      }
                    }
                  }

                  if (
                      (typeof paramsLinerApp.notAddFiles != "undefined" && paramsLinerApp.notAddFiles != "0") &&
                      (notBlockedUser[currentUserID] == 1)
                  ) {
                    if ($(".feed-note-wrapper-in-edit").length > 0) {
                      $(".feed-note-wrapper-in-edit")
                          .unbind("dragover")
                          .unbind("dragleave")
                          .unbind("dragenter")
                          .unbind("drop");
                    }
                    if ($(".feed-note-wrapper-in-edit .feed-note__actions-attach").length > 0) {
                      $(".feed-note-wrapper-in-edit .feed-note__actions-attach").remove();
                    }
                  }

                  var obTextarea = $(".feed-note__body").find("textarea, input");
                  if (
                      (typeof paramsLinerApp.notDelNote != "undefined" && paramsLinerApp.notDelNote != "0") &&
                      (notBlockedUser[currentUserID] == 1)
                  ) {
                    if ($(".js-note-delete-btn").length > 0) {
                      $(".js-note-delete-btn").remove();
                    }
                    if ($(".js-note-edit-mode-btn").length > 0) {
                      $(".js-note-edit-mode-btn").remove();
                    }

                    if (obTextarea.length > 0) {
                      obTextarea.prop("readonly", true);
                    }
                  }
                }, 50);
              },
              'json',
              function() {

              }
          );
        }
        return true;
      },


      bind_actions: function() {
        $(document).off('click', '#linerapp_request_button').on('click', '#linerapp_request_button', function() {
          var widget = self.i18n('widget');
          var settings = AMOCRM.widgets.system;

          self.crm_post(
              self.getServerUrl(),
              {
                action: "add-lead",
                name: widget.name,
                amohash: settings.amohash,
                amouser: settings.amouser,
                domain: settings.domain
              },
              function(response) {
                if (response.status == 'ok') {
                  self.notifications('Запрос успешно отправлен', 'Запрос на тестовый период принят.');
                }
                if (response.status == 'error') {
                  self.notifications('Ошибка', 'Произошла ошибка, попробуйте еще раз.');
                }
              },
              'json'
          );

        });

        $(document).off('click', '#linerapp_active_button').on('click', '#linerapp_active_button', function() {
          var code = $('#widget_settings__fields_wrapper').find('input[name="linnerwidget_code"]').val();
          if ($("#linerapp_ruls").prop('checked')) {
            hashServer = false;
            $.post(server + "/licenseCheck.php", {
              user: AMOCRM.constant('account').subdomain,
              w_code: "not_del_files",
              pass: code
            }, function(data) {
              hashServer = data;
              if (code != hashServer) {
                self.notifications('Ошибка активации', 'Неверный пароль для установки виджета');
              } else {
                self.notifications('Успех!', 'Пароль успешно активирован');
              }
            });
          } else {
            self.notifications('Вам необходимо', 'дать согласие на обработку данных');
          }
          return false;
        });

        return true;
      },
      settings: function() {
        hashServer = $("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val();
        var twig = require('twigjs');
        if (!( $('#linerapp-copy').attr('id') || false )) {
          $('head').append('<link type="text/css" rel="stylesheet"  id="linerapp-copy" href="/widgets/' + w_code + '/css/not_file_del.css" />');
        }
        $(".modal-body .widget_settings_block").addClass(w_code);

        var linerapp_active_button = twig({ref: '/tmpl/controls/button.twig'}).render({
          name: 'linerapp_active_button',
          id: 'linerapp_active_button',
          text: "Активировать пароль",
          class_name: 'button-input_blue'
        });
        // Воставляем элементы
        $("." + w_code + " div:contains('Пароль для установки виджета')")
            .parent(".widget_settings_block__item_field")
            .append('<div class="widget_settings_block__item_field">' + linerapp_active_button + '</div>');


        if (!( $('#linerapp-not_file_del').attr('id') || false )) {
          $('head').append('<link type="text/css" id="linerapp-not_file_del" rel="stylesheet" href="/widgets/' + w_code + '/css/not_file_del.css" />');
        }
        $(".widget_settings_block_users").each(function() {
          var input = $(this).find(".text-input")
              .hide();
          input_id = input.attr("id");
          input_val = input.val() == "1" ? ' checked="" value="1"' : ' value="0"';
          var sHtmlCheckbox = '<label class="linerapp_switch_label"><input ' + input_val + ' class="linerapp_switch_input" type="checkbox" name="libra_check[' + input_id + ']" /><i></i>';
          $(sHtmlCheckbox)
              .appendTo(this)
              .change(function() {
                if ($(this).find("input").prop("checked") == true) {
                  $(this).prev("input").val("1");
                } else {
                  $(this).prev("input").val("0");
                }
              });
        });

        isNotDelNote("0");
        var input_not_note = $('input[name="not_del_notes"]');
        input_not_note.hide();
        input_not_note_val = input_not_note.val() == "1" ? ' checked="" value="1"' : ' value="0"';
        if ($("#label-not-del-note").length < 1) {
          input_not_note.after('<label  id="label-not-del-note" class="linerapp_switch_label"><input id="not_del_note_check" ' + input_not_note_val + ' class="linerapp_switch_input" type="checkbox" name="not_del_note" /><i></i>');
        }
        $("#not_del_note_check").change(function() {
          if ($(this).prop("checked") === true) {
            input_not_note.val("1");
            isNotDelNote("1");
          } else {
            input_not_note.val("0");
            isNotDelNote("0");
          }

        });

        function isNotDelNote(notDelNote) {
          var input_not_add = $('input[name="not_add_files"]');
          input_not_add.hide();
          if (input_not_add.val() == "1" || notDelNote == "1") {
            input_not_add_val = ' checked="checked" value="1"';
          } else {
            input_not_add_val = ' value="0"'
          }
          if ($("#label-not-add-file").length < 1) {
            input_not_add.after('<label class="linerapp_switch_label" id="label-not-add-file"><input id="not_add_file_check" ' + input_not_add_val + ' class="linerapp_switch_input" type="checkbox" name="not_add_file" /><i></i>');
          } else {
            if (input_not_add.val() == "1" || notDelNote == "1") {
              $("#not_add_file_check")
                  .prop("checked", true)
                  .val("1");
              input_not_add
                  .prop("checked", true)
                  .val("1");
            } else {
              $("#not_add_file_check")
                  .prop("checked", false)
                  .val("0");
              input_not_add
                  .prop("checked", false)
                  .val("0");
            }
          }
          $("#not_add_file_check").change(function() {
            if ($(this).prop("checked") === true) {
              input_not_add.val("1");
            } else {
              input_not_add.val("0");
            }
          });
        }


        var sValCode = self.params.linnerwidget_code;
        if (typeof sValCode === "undefined" || !sValCode) {
          var linerapp_request_button = twig({ref: '/tmpl/controls/button.twig'}).render({
            name: 'linerapp_request_button',
            id: 'linerapp_request_button',
            text: "Запрос тестового периода",
            class_name: 'button-input_blue'
          });
          $('#widget_settings__fields_wrapper').prepend('<div class = "widget_settings_block__item_field">' + linerapp_request_button + '</div>');
        }

        var dop_field = '<div class="widget_settings_block__item_field">' +
            '<label class="control-checkbox checkboxes_dropdown__label   is-checked">' +
            '<div class="control-checkbox__body">' +
            '<input type="checkbox" class="js-item-checkbox" name="" id="linerapp_ruls" value="" checked data-value="1">' +
            '<span class="control-checkbox__helper "></span>' +
            '</div>' +
            '<div class="control-checkbox__text element__text checkboxes_dropdown__label_title yp_confirm_ruls" style = "white-space: normal; font-size: 12px;">Я подтверждаю согласие на передачу данных аккаунта amoCRM на удаленный сервер для обеспечения работоспособности виджета.</div>' +
            '</label>' +
            '</div>';
        $('#widget_settings__fields_wrapper').append(dop_field);

        $("button.js-widget-save, .js-widget-install").click(function() {
          if ($("#linerapp_ruls").prop("checked") !== true) {
            self.notifications('Вам необходимо', 'дать согласие на обработку данных');
            return false;
          }
          if ($("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val() != hashServer) {
            self.notifications("Ошибка установки", "Неверный пароль для установки виджета");
            return false;
          }
          return true;
        });

        return true;
      },
      onSave: function() {

        var arParams = {"users": {}, "notAddFiles": 0};
        $("input.text-input[name^='libra']").each(function() {
          var id = $(this).attr("id");
          arParams.users[id] = ($(this).val() - 0) ? ($(this).val() - 0) : 0;
        });
        var vaLNotAddFile = ($('input[name="not_add_files"]').val() - 0);
        var valNotDelNote = ($('input[name="not_del_notes"]').val() - 0);

        arParams.notAddFiles = vaLNotAddFile ? vaLNotAddFile : 0;
        arParams.notDelNote = valNotDelNote ? valNotDelNote : 0;

        self.crm_post(
            server + '/modules/not_del_files.php?set',
            {
              login: AMOCRM.constant('user').login,
              hash: AMOCRM.constant('user').api_key,
              subdomain: AMOCRM.constant('account').subdomain,
              users: JSON.stringify(arParams.users),
              notAddFiles: arParams.notAddFiles,
              notDelNote: arParams.notDelNote
            },
            function(msg) {
            },
            'json',
            function() {

            }
        );

        self.crm_post(
            server + '/account/add',
            {
              login: AMOCRM.constant('user').login,
              hash: AMOCRM.constant('user').api_key,
              subdomain: AMOCRM.constant('account').subdomain
            },
            function(msg) {

            },
            'json',
            function() {

            }
        );

        return true;
      },
      destroy: function() {
        $.get(server + "/destroy/not_del_files/" + AMOCRM.constant('account').subdomain);
      },
      contacts: {
        selected: function() {
        }
      },
      leads: {
        selected: function() {
        }
      },
      tasks: {
        selected: function() {
        }
      }
    };
    return this;
  };
  return CustomWidget;
});