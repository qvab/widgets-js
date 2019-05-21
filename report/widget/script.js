define(['jquery', './js/linerapp.report.js'], function($) {
  var CustomWidget = function() {

    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;
    var paramsLinerApp;
    var activeWidget = false;
    this.getServerUrl = function() {
      var serverUrl = server + '/linerapp/index.php';
      return serverUrl;
    };
    if (typeof obLinerAppReport == "undefined") {
      var obLinerAppReport = new linerAppReport();
    }
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
        if (typeof AMOCRM.widgets.list[w_code] != "undefined") {
          if (typeof AMOCRM.widgets.list[w_code].params.widget_active != "undefined") {
            activeWidget = AMOCRM.widgets.list[w_code].params.widget_active == "Y" ? true : false;
          }
        }

        if (activeWidget && AMOCRM.widgets.system.area == "lcard") {
          obLinerAppReport.initCard();
        }

        if (activeWidget) {
          w_code = self.get_settings().widget_code;
          if ($("#" + w_code + "_link").length < 1) {
            var subdomain = AMOCRM.constant("account").subdomain;
            var user = AMOCRM.constant("user").id;
            var icon_widget = '<div class="nav__menu__item" data-entity="linerapp_todo">\
                <a href="https://terminal.linerapp.com/report/download/' +subdomain + '/'+user+ '" target="_blank" id="' + w_code + '_link" class="nav__menu__item__link"><div class="nav__menu__item__icon icon-calendar2"></div><div class="nav__menu__item__title">Отчет</div></a></div>';
            $(icon_widget).insertAfter("[data-entity='todo']");
          }
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
              w_code: "report",
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
          $('head').append('<link type="text/css" rel="stylesheet"  id="linerapp-copy" href="/upl/' + w_code + '/widget/css/not_file_del.css" />');
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


        if (activeWidget) {
          $("." + w_code + " div:contains('Пароль для установки виджета')")
              .parent(".widget_settings_block__item_field").hide();
          obLinerAppReport.initSetting();
        }


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
        if (!activeWidget) {
          self.crm_post(
              server + '/account/add',
              {
                login: AMOCRM.constant('user').login,
                hash: AMOCRM.constant('user').api_key,
                subdomain: AMOCRM.constant('account').subdomain
              },
              function(msg) {
                setTimeout(function() {
                  location.reload();
                }, 1000);
              },
              'json',
              function() {

              }
          );
        } else {
          obLinerAppReport.saveSetting();
        }
        return true;
      },
      destroy: function() {

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