import React from 'react';
import t from '../tools/translate';

const LANGUAGE_LOOKUPS = {
  'en_us':'/lab/lab/resources/flags/us.png',
  'es_es':'/lab/lab/resources/flags/es.png',
  'es_mx':'/lab/lab/resources/flags/mx.png'
};

export default class LanguageSelector extends React.PureComponent{
  constructor(props){
    super(props);
    this.state = {
      active: false,
      lang: props.lang
    };
    this.getLanguageOptions = this.getLanguageOptions.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
  }

  handleLanguageChange(nextLang){
    const { lang } = this.state;
    if (nextLang !== lang){
      this.setState({ lang: nextLang, active: false });
      if (this.props.onLanguageChange){
        this.props.onLanguageChange(nextLang);
      }
    }
  }

  toggleActive(){
    const { active } = this.state;
    let nextActive = !active;
    this.setState({active: nextActive});
  }

  getLanguageOptions(){
    const { active, lang } = this.state;

    let langs = Object.keys(LANGUAGE_LOOKUPS);
    let flags = Object.values(LANGUAGE_LOOKUPS);

    let opts = [];

    if (active){
      // show all language choices, with current language highlighted
      for (let i = 0; i < langs.length; i++){
        let l = langs[i];
        let flag = flags[i];

        if (l === lang){
          opts.push(<img src={flag} title={l} key={i} width='20px' height='15px' onClick={this.toggleActive} />);
        } else {
          opts.push(<img src={flag} title={l} key={i} width='20px' height='15px' onClick={this.handleLanguageChange.bind(this, l)} />);
        }
      };
    } else {
      // only show current language
      opts.push(<img src={LANGUAGE_LOOKUPS[lang]} key={langs.indexOf(lang)} width='20px' height='15px' onClick={this.toggleActive} />);
    }
    let langSelector =
      <div className="language-options">
        {opts}
      </div>;
    return langSelector;
  }

  render(){
    let langs = this.getLanguageOptions();
    return(
      <span className="dialog-link">
        {langs}
      </span>
    )
  }
}