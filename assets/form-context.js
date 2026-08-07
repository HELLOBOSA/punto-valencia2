(function(){
  var forms=document.querySelectorAll('form[data-lead-context]');

  var utmKeys=['utm_source','utm_medium','utm_campaign','utm_term','utm_content'];
  var storageKey='wolfblanc-lead-context-v1';

  function cleanUrl(value){
    if(!value)return '';
    try{
      var url=new URL(value,window.location.href);
      return url.origin+url.pathname;
    }catch(error){
      return '';
    }
  }

  function readStored(){
    try{
      return JSON.parse(sessionStorage.getItem(storageKey)||'{}');
    }catch(error){
      return {};
    }
  }

  function writeStored(value){
    try{
      sessionStorage.setItem(storageKey,JSON.stringify(value));
    }catch(error){}
  }

  function captureJourney(){
    var stored=readStored();
    var params=new URLSearchParams(window.location.search);
    var hasCampaign=false;

    utmKeys.forEach(function(key){
      var value=params.get(key);
      if(value){
        stored[key]=value.slice(0,300);
        hasCampaign=true;
      }
    });

    if(!stored.referrer&&document.referrer){
      stored.referrer=cleanUrl(document.referrer);
    }
    if(!stored.landing_page||hasCampaign){
      stored.landing_page=cleanUrl(window.location.href);
    }

    writeStored(stored);
    return stored;
  }

  function hiddenField(form,name){
    var field=form.querySelector('input[type="hidden"][name="'+name+'"]');
    if(field)return field;
    field=document.createElement('input');
    field.type='hidden';
    field.name=name;
    form.appendChild(field);
    return field;
  }

  function currentLanguage(){
    var active=document.querySelector('[data-lang-switch].active');
    return (active&&active.getAttribute('data-lang-switch'))||
      document.documentElement.getAttribute('lang')||
      'unknown';
  }

  function populate(form){
    var journey=captureJourney();
    var values={
      website:form.getAttribute('data-lead-site')||window.location.hostname,
      source_page:cleanUrl(window.location.href),
      language:currentLanguage(),
      market:form.getAttribute('data-lead-market')||'',
      service_or_audience:form.getAttribute('data-lead-context')||'general_project_enquiry',
      referrer:journey.referrer||'',
      landing_page:journey.landing_page||''
    };

    utmKeys.forEach(function(key){
      values[key]=journey[key]||'';
    });

    if(form.querySelector('input[name="privacy_consent"]:checked')){
      values.consent_timestamp=new Date().toISOString();
    }

    Object.keys(values).forEach(function(name){
      hiddenField(form,name).value=values[name];
    });
  }

  captureJourney();

  /* on a page with no form the journey is still recorded, so a visitor who
     arrives on an article keeps their entry point and campaign tags */
  if(!forms.length)return;

  forms.forEach(function(form){
    populate(form);
    form.addEventListener('submit',function(){
      populate(form);
    },true);
  });
})();
