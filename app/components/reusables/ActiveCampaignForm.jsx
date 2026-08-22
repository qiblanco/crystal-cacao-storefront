import {useEffect, useRef} from 'react';

export function ActiveCampaignForm({formId}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const formDiv = document.createElement('div');
    formDiv.className = `_form_${formId}`;
    container.appendChild(formDiv);

    const script = document.createElement('script');
    script.src = `https://qiblanco.activehosted.com/f/embed.php?id=${formId}`;
    script.charset = 'utf-8';

    const removeStrays = () => {
      document
        .querySelectorAll(`._form_${formId}`)
        .forEach((el) => {
          if (!container.contains(el)) el.remove();
        });
    };

    script.addEventListener('load', () => {
      // The script may append extra form elements to the body — remove them
      removeStrays();
      // Some AC scripts inject asynchronously, catch those too
      setTimeout(removeStrays, 1000);
    });

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
      removeStrays();
    };
  }, [formId]);

  return <div ref={containerRef} />;
}
