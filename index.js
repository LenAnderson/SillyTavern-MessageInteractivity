import { callPopup, chat, eventSource, event_types, messageFormatting, saveChatDebounced, sendSystemMessage, substituteParams } from '../../../../script.js';
import { executeSlashCommands, registerSlashCommand } from '../../../slash-commands.js';
import { debounce } from '../../../utils.js';
import { quickReplyApi } from '../../quick-reply/index.js';




const handlePrompt = async (vars, varName, message = '', defaultValue = '') => {
    const result = await callPopup(message, 'input', defaultValue);
    if (result !== undefined) {
        vars[varName] = result;
    }
    return result ?? '';
};
const handleConfirm = async (vars, varName, message = '') => {
    vars[varName] = await callPopup(message, 'confirm');
    return '';
};
const handleAlert = async (vars, message = '') => {
    await callPopup(message, 'text');
    return '';
};
const handleVar = async (vars, varName) => {
    return vars[varName];
};
const handleButton = async (vars, label, cmdOrQrSet = null, qrLabel = null) => {
    let cmd;
    let qrSet;
    if (cmdOrQrSet) {
        if (cmdOrQrSet[0] == '/') {
            cmd = cmdOrQrSet;
        } else {
            qrSet = cmdOrQrSet;
        }
    }
    const btn = document.createElement('button'); {
        btn.classList.add('stmi--button');
        btn.textContent = label;
        btn.setAttribute('data-stmi--vars', JSON.stringify(vars));
        if (cmd) {
            btn.setAttribute('data-stmi--cmd', cmd);
        } else if (qrSet && qrLabel) {
            btn.setAttribute('data-stmi--qrs', qrSet);
            btn.setAttribute('data-stmi--qr', qrLabel);
        }
    }
    return btn.outerHTML;
};

const mapping = {
    input: handlePrompt,
    prompt: handlePrompt,
    confirm: handleConfirm,
    alert: handleAlert,
    mesvar: handleVar,
    button: handleButton,
};


const handleMessage = async(mesIdx) => {
    let isChanged = false;
    const mes = chat[mesIdx];
    let text = mes.mes;
    const vars = {};
    let match;
    while (match = text.match(/{{(input|prompt|confirm|alert|mesvar|button)::((?:(?!}}).)+)}}/i), match) {
        isChanged = true;
        console.log('[STMI]', match);
        if (mapping[match[1]]) {
            text = `${text.slice(0, match.index)}${await mapping[match[1]](vars, ...match[2].split('::'))}${text.slice(match.index + match[0].length)}`;
        }
    }
    const el = document.querySelector(`#chat > .mes[mesid="${mesIdx}"] .mes_text`);
    if (isChanged) {
        mes.mes = text;
        saveChatDebounced();
        if (el) {
            let messageText = substituteParams(text);
            messageText = messageFormatting(
                messageText,
                mes.name,
                mes.is_system,
                mes.is_user,
                mesIdx,
            );
            el.innerHTML = messageText;
        }
        console.log('[STMI]', text, vars);
    }
    Array.from(el.querySelectorAll('.custom-stmi--button')).forEach(btn=>{
        btn.addEventListener('click', async(evt)=>{
            if (btn.hasAttribute('data-stmi--cmd')) {
                await executeSlashCommands(btn.getAttribute('data-stmi--cmd'));
            } else if (btn.hasAttribute('data-stmi--qrs') && btn.hasAttribute('data-stmi--qr')) {
                const qr = quickReplyApi.getQrByLabel(btn.getAttribute('data-stmi--qrs'), btn.getAttribute('data-stmi--qr'));
                if (qr) {
                    await qr.execute(JSON.parse(btn.getAttribute('data-stmi--vars')));
                }
            }
        });
    });
};
const handleMessageDebounced = debounce(handleMessage);

eventSource.on(event_types.USER_MESSAGE_RENDERED, (mesIdx)=>handleMessageDebounced(mesIdx));
eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (mesIdx)=>handleMessageDebounced(mesIdx));
eventSource.on(event_types.MESSAGE_EDITED, (mesIdx)=>handleMessageDebounced(mesIdx));
eventSource.on(event_types.CHAT_CHANGED, async()=>{
    const mesList = Array.from(document.querySelectorAll('#chat > .mes[mesid]'));
    for (const mes of mesList) {
        await handleMessage(mes.getAttribute('mesid'));
    }
});


registerSlashCommand(
    'messageinteractivity?',
    ()=>{
        const message = `
            <ul style='text-align:left;'>
                <li>
                    <code>{{input::<q>varName</q>::<q>message</q>::<q>defaultValue</q>}}</code>
                    <p>
                        Request user input and replace with result. Result will be saved with the given varName.<br>
                        Optional: message, defaultValue
                    </p>
                </li>
                <li>
                    <code>{{prompt::<q>varName</q>::<q>message</q>::<q>defaultValue</q>}}</code>
                    <p>
                        Alias for {{input::...}}<br>
                        Optional: message, defaultValue
                    </p>
                </li>
                <li>
                    <code>{{confirm::<q>varName</q>::<q>message</q>}}</code>
                    <p>
                        Request user confirm (yes/no). Result will be saved with the given varName.
                        Optional: message
                    </p>
                </li>
                <li>
                    <code>{{alert::<q>message</q>}}</code>
                    <p>
                        Display a message popup / modal to the user.
                    </p>
                </li>
                <li>
                    <code>{{mesvar::<q>varName</q>}}</code>
                    <p>
                        Replaced with the variable value from an earlier {{input::...}} or {{confirm::...}}.
                    </p>
                </li>
                <li>
                    <code>{{button::<q>label</q>::<q>slashCommandOrQuickReplySetName</q>::<q>quickReplyLabel</q>}}</code>
                    <p>
                        Replaced with the button that executes the provided slash command or Quick Reply on click.<br>
                        If a QR set name and QR label are provided, the executed QR will have all the variables from
                        earlier {{input::...}} and {{confirm::...}} available via {{arg::varName}}.<br>
                        Optional: slashCommandOrQuickReplySetName, quickReplyLabel
                    </p>
                </li>
            </ul>
        `;
        sendSystemMessage('generic', message);
    },
    [],
    'Message Interactivity help.',
    true,
    true,
);
