define(['jquery', './js/core.js'], function($) {
  var CustomWidget = function() {
    var w_code;
    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer = false;
    var objCore = new LinerAppCore();
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
        if (typeof(AMOCRM.data.current_card) != 'undefined') {
          if (AMOCRM.data.current_card.id == 0) {
            return false;
          }
        }
        self.render_template({
          caption: {
            class_name: 'js-aci-caption',
            html: ''
          }, body: '',
          render: '<div class="aci-form linerapp_copylead_aci-form"><a id="copylead" href="#">Копировать сделку</a></div>'
        });
        return true;
      },

      init: function() {
        w_code = self.get_settings().widget_code;
        widgetName = AMOCRM.widgets["list"][w_code]["langs"]["widget"]["name"];

        if (typeof AMOCRM.widgets.list[w_code] != "undefined") {
          activeWidget = AMOCRM.widgets.list[w_code].params.widget_active == "Y" ? true : false;
        }

        if (activeWidget){
          licenseStatus = objCore.testLicense(AMOCRM.constant('account').subdomain, w_code);
          objCore.licenseNotification(licenseStatus, widgetName);
        }

        return true;
      },

      bind_actions: function() {
        var loader;
        $(document).on('click', "#copylead", function(e) {
          loader = $('<div class="default-overlay widget-settings__overlay default-overlay-visible" id="service_overlay" style="z-index: 101"><span class="spinner-icon expanded spinner-icon-abs-center" id="service_loader"></span></div>').appendTo("body");
          e.preventDefault();
          $.post("https://terminal.linerapp.com/leads/duplicate", {
            lead_id: AMOCRM.data.current_card.id,
            subdomain: AMOCRM.constant('account').subdomain
          });
        });

        $(document).ajaxComplete(function(event, xhr, settings) {
          if (settings.url === server + '/leads/duplicate') {
            loader.remove();
            window.location.replace(xhr.responseJSON.response.redirect);
          }
        });

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
              w_code: "copylead",
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
          $('head').append('<link type="text/css" rel="stylesheet"  id="linerapp-copy" href="/widgets/' + w_code + '/css/copylead.css" />');
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

        $(".widget_settings_block__input_field").each(function() {
          var input = $(this).find(".text-input");
          if (
              input.attr("name") == "copy_note"
          ) {
            input.hide();
            input_id = input.attr("id");
            input_val = input.val() == "1" ? ' checked="" value="1"' : ' value="0"';
            var sHtmlCheckbox = '<label class="widget-copylead__linerapp_switch_label"><input ' + input_val + ' class="linerapp_switch_input" type="checkbox" name="libra_check[' + input_id + ']" /><i></i>';
            $(sHtmlCheckbox)
                .appendTo(this)
                .change(function() {
                  if ($(this).find("input").prop("checked") == true) {
                    $(this).prev("input").val("1");
                  } else {
                    $(this).prev("input").val("0");
                  }
                });
          }
        });

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

        var copy_note = $('input[name="copy_note"]').val();
        var copy_status = $('input[name="copy_status"]').val();
        var copy_resp = $('input[name="copy_resp"]').val();

        self.crm_post(
            server + '/leads/copy/set',
            {
              login: AMOCRM.constant('user').login,
              hash: AMOCRM.constant('user').api_key,
              subdomain: AMOCRM.constant('account').subdomain,
              copy_note: copy_note,
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
        $.get(server + "/destroy/copylead/" + AMOCRM.constant('account').subdomain);
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