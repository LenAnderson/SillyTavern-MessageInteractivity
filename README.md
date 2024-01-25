# Message Interactivity

Adds some macros for interacting with messages when they are first rendered.




## Installation

Use ST's inbuilt extension installer with this URL:
https://github.com/LenAnderson/SillyTavern-MessageInteractivity/




## Usage

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
