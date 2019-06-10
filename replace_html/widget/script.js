define(['jquery'], function ($) {
  var CustomWidget = function () {
    var w_code;
    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;
    var paramsLinerApp;
    var activeWidget = false;
    this.getServerUrl = function () {
      var serverUrl = server + '/linerapp/index.php';
      return serverUrl;
    };

    this.notifications = function (header, message, wait_time) {
      var inbox = $('#popups_inbox'),
        zIndex = inbox.css('z-index'),
        t = wait_time || 6000;

      AMOCRM.notifications.show_message_error({
        text: message || '', header: header || ''
      });
      inbox.css('z-index', 9001);
      setTimeout(function () {
        inbox.css('z-index', zIndex);
      }, t);
    };

    this.callbacks = {
      render: function () {
        return true;
      },

      init: function () {
        console.log("init replace");
        w_code = self.get_settings().widget_code;
        if (typeof AMOCRM.widgets.list[w_code] != "undefined") {
          activeWidget = AMOCRM.widgets.list[w_code].params.widget_active == "Y" ? true : false;
        }
        if (activeWidget) {
          setInterval(function () {
            replaceLeadText();
          }, 50);

          function replaceLeadText() {

              arrArrWords = [
                ['Сделки', 'Заявки'],
                ['сделки', 'заявки'],
                ['сделка', 'заявка'],
                ['Сделка', 'Заявка'],
                ['сделок', 'заявок'],
                ['СДЕЛОК', 'ЗАЯВОК'],
                ['СДЕЛКИ', 'ЗАЯВКИ'],
                ['Сделок', 'Заявок'],
                ['сделке', 'заявке']
              ];
            if (
              $("*:contains('Сделки')").length > 0 ||
              $("*:contains('сделки')").length > 0 ||
              $("*:contains('сделка')").length > 0 ||
              $("*:contains('Сделка')").length > 0 ||
              $("*:contains('сделок')").length > 0 ||
              $("*:contains('СДЕЛОК')").length > 0 ||
              $("*:contains('СДЕЛКИ')").length > 0 ||
              $("*:contains('Сделок')").length > 0 ||
              $("*:contains('сделке')").length > 0
            ) {
              //Замена в текстовых нодах

              $('body :not(script)').contents().filter(function () {
                return this.nodeType === 3;
              }).replaceWith(function () {
                string = this.nodeValue;

                $.each(arrArrWords, function (i, val) {
                  string = string.replace(val[0], val[1]);
                });
                return string;
              });

              //Замена в placeholder

              $.each($('input'), function (i, input) {
                $.each(arrArrWords, function (k, word) {
                  input.placeholder = input.placeholder.replace(word[0], word[1]);
                });
              });
            }
          }

          replaceLeadText();

        }
        return true;
      },


      bind_actions: function () {
        $(document).off('click', '#linerapp_request_button').on('click', '#linerapp_request_button', function () {
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
            function (response) {
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

        $(document).off('click', '#linerapp_active_button').on('click', '#linerapp_active_button', function () {
          var code = $('#widget_settings__fields_wrapper').find('input[name="linnerwidget_code"]').val();
          if ($("#linerapp_ruls").prop('checked')) {
            hashServer = false;
            $.post(server + "/licenseCheck.php", {
              user: AMOCRM.constant('account').subdomain,
              w_code: "replace_html",
              pass: code
            }, function (data) {
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
      settings: function () {
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
          $('head').append('<link type="text/css" id="linerapp-not_file_del" rel="stylesheet" href="/' + w_code + '/widget/css/not_file_del.css" />');
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

        $("button.js-widget-save, .js-widget-install").click(function () {
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
      onSave: function () {

        var arParams = {"users": {}, "notAddFiles": 0};
        $("input.text-input[name^='libra']").each(function () {
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
          function (msg) {
          },
          'json',
          function () {

          }
        );

        self.crm_post(
          server + '/account/add',
          {
            login: AMOCRM.constant('user').login,
            hash: AMOCRM.constant('user').api_key,
            subdomain: AMOCRM.constant('account').subdomain
          },
          function (msg) {

          },
          'json',
          function () {

          }
        );

        return true;
      },
      destroy: function () {
        $.get(server + "/destroy/replace_html/" + AMOCRM.constant('account').subdomain);
      },
      contacts: {
        selected: function () {
        }
      },
      leads: {
        selected: function () {
        }
      },
      tasks: {
        selected: function () {
        }
      }
    };
    return this;
  };
  return CustomWidget;
});