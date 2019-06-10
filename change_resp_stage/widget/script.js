define(['jquery'], function($) {
  var CustomWidget = function() {
    var w_code;
    var self = this;
    var server = "https://terminal.linerapp.com";
    var hashServer;
    $.post(server + "/licenseCheck.php", {
      user: AMOCRM.constant('account').subdomain,
      w_code: "changer"
    }, function(data) {
      hashServer = data;
    });

    self.getTemplate = function(template, params, callback) {
      params = (typeof params == 'object') ? params : {};
      template = template || '';

      return self.render({
        href: '/templates/' + template + '.twig',
        base_path: self.params.path,
        load: callback
      }, params);
    };

    this.getServerUrl = function() {
      var serverUrl = 'https://terminal.linerapp.com/linerapp/index.php';
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

    self.notAllowedChangeResponsibleStatus = function(fields) {
      if (self.system().area == 'lcard') {
        if (!users[AMOCRM.constant('user').id]["is_admin"]) {
          if (!$.isEmptyObject(fields.responsible)) {
            if (!fields.responsible[AMOCRM.constant('user').id]) {
              $("#lead_main_user-users_select_holder").hide()
              if (!$(".linked-form__field.linked-form__field_reassign .linked-form__field__value > span").length) {
                $(".linked-form__field.linked-form__field_reassign .linked-form__field__value").append("<span class='linked-form__field-inner_no-rights'>" + AMOCRM.constant('account').users[AMOCRM.data.current_card.main_user] + "</span");
              }
            }
            else {
              $(".linked-form__field.linked-form__field_reassign .linked-form__field__value > span").remove();
              $("#lead_main_user-users_select_holder").show()
            }
          }
          else {
            $("#lead_main_user-users_select_holder").hide()
            if (!$(".linked-form__field.linked-form__field_reassign .linked-form__field__value > span").length) {
              $(".linked-form__field.linked-form__field_reassign .linked-form__field__value").append("<span class='linked-form__field-inner_no-rights'>" + AMOCRM.constant('account').users[AMOCRM.data.current_card.main_user] + "</span");
            }
          }

          if (fields.statuses[pipeline_id]) {
            if (fields.reverse_order_status)
              $('input[type="radio"][name="lead[STATUS]"][value="' + status_id + '"]').parent().prevAll().remove()

            $('input[type="radio"][name="lead[STATUS]"][value="' + fields.statuses[pipeline_id] + '"]').parent().nextAll().remove()
            $('input[type="radio"][name="lead[STATUS]"][value="' + fields.statuses[pipeline_id] + '"]').parent().remove()
          }
        }
      }
    }

    this.callbacks = {
      render: function() {
        pipelines = [];
        users = [];
        statuses = {};
        w_code = self.get_settings().widget_code;

        $.ajax({
          url: '/api/v2/account?with=pipelines,users',
          async: false,
          success: function(data) {
            $.each(data._embedded.pipelines, function(index, value) {
              var statuses_by_pipeline = [{option: 'Выбрать', id: 0, sort: 0}];
              pipeline = {option: value.name, id: value.id};
              pipelines.push(pipeline);

              for (var property1 in value.statuses) {
                var st = {
                  option: value.statuses[property1].name,
                  id: value.statuses[property1].id,
                  sort: value.statuses[property1].sort
                };
                statuses_by_pipeline.push(st);
              }

              statuses[index] = statuses_by_pipeline;
              statuses[index].sort(function(a, b) {
                return a.sort - b.sort;
              });
            });

            users = data._embedded.users;
          }
        });

        if (self.system().area == 'lcard') {
          if (typeof AMOCRM.data.current_card.id == 'undefined') {
            return false
          }

          $.ajax({
            url: 'https://terminal.linerapp.com/leads/change/' + AMOCRM.constant('account').subdomain + '/respstage',
            method: "GET",
            dataType: 'json',
            async: false,
            cache: false,
            success: function(data) {
              if (data.response)
                fields = data.response.fields
            }
          });

          $.ajax({
            url: '/api/v2/leads?id=' + AMOCRM.data.current_card.id,
            method: "GET",
            async: false,
            success: function(data) {
              pipeline_id = data._embedded.items[0].pipeline.id;
              status_id = data._embedded.items[0].status_id;
            }
          });
        }

        if (!( $('#linerapp-resp-stage').attr('id') || false )) {
          $('body').append('<link rel="stylesheet" href="/widgets/' + w_code + '/css/resp_stage.css"><div style="display:none;" id="linerapp-resp-stage"></div>');
        }

        return true;
      },
      init: function() {

        return true;
      },
      bind_actions: function() {

        $(document).on("click", ".linerapp_switch_input", function(e) {
          this.value = (this.checked) ? 1 : 0;
        });

        $(document).ajaxComplete(function(event, xhr, settings) {
          if (self.system().area == 'lcard') {
            if (typeof fields != 'undefined')
              self.notAllowedChangeResponsibleStatus(fields);
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
                domain: settings.domain,
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

        return true;
      },
      settings: function() {
        hashServer = $("#widget_settings__fields_wrapper").find('input[name="linnerwidget_code"]').val();
        var sValCode = self.params.linnerwidget_code;
        if (typeof sValCode == "undefined" || !sValCode) {
          var twig = require('twigjs');
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
        $(".widget_settings_block__item_field:eq(1)").hide();

        $.ajax({
          url: 'https://terminal.linerapp.com/leads/change/' + AMOCRM.constant('account').subdomain + '/respstage',
          method: "GET",
          dataType: 'json',
          success: function(data) {
            self.getTemplate(
                'login_block',
                {},
                function(template) {
                  $(".widget_settings_block__item_field:eq(2)").before(
                      template.render({
                        users: users,
                        sfields: data.response ? data.response.fields : null,
                        pipelines: pipelines,
                        statuses: statuses
                      })
                  );
                }
            );
          }
        });

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
        var data = $("#linerapp_resp_stage_form").serializeArray();
        data.push({name: "subdomain", value: AMOCRM.constant('account').subdomain});
        data.push({name: "login", value: AMOCRM.constant('user').login});
        data.push({name: "hash", value: AMOCRM.constant('user').api_key});
        data.push({name: "pipelines", value: JSON.stringify(statuses)});

        $.ajax({
          url: 'https://terminal.linerapp.com/leads/change/respstage',
          method: "POST",
          data: data,
          dataType: 'json',
          success: function(data) {
          }
        });

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
