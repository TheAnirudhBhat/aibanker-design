# Onboarding character research (Mobbin) — 2026-07-02

Source: 5-way Mobbin sweep (AI-assistant self-intros, Duolingo/mascot, wellness, chat-format, motion) + synthesis. For the new-user-beta chat onboarding (Ryan/Byron).

# brief: making ryan land in chat onboarding

## 1. What great character onboardings do

**Establish the persona in message one, not on a separate "meet the character" card.** The strongest flows prove the character by rendering a hand-crafted opening bubble whose voice *is* the personality, avatar attached, tone demonstrated not asserted. [Pi](https://mobbin.com/flows/0c9c1310-01cc-4412-91ba-b0ed048b4f54) opens the very first screen as a live chat ("I'm Pi, your AI sidekick who lives for meaningful talks"); [Character.AI](https://mobbin.com/flows/c6596ed1-43af-4fed-afc9-a77a0571c2fc) shows the exact greeting bubble the character will use ("Ah, hello there! I'm Sam Lee"). No bio screen nobody reads.

**Fragment the intro across 2-3 staggered bubbles with typing dots, not one paragraph.** [Navigator](https://mobbin.com/screens/807dbf2c-f2f2-4730-8afd-4372c9baaecd) splits its hello into "Hey there!" / "I'm Navigator" / "What should I call you?", each animating in on a delay so it reads like a human texting. [GoHenry's Gobot](https://mobbin.com/screens/3264627d-412d-445a-a094-3f5ff3ee7bd9) choreographs name to identity to a hero-illustration bubble to a forced user "hello" handshake. [Wysa](https://mobbin.com/flows/acedbf77-df04-46ac-8935-ead41689925c) puts a real typing-dots delay before each bubble. The animation lives in *how messages arrive*.

**Never ask a bare question, and never show a bare input.** Every answer is acknowledged before the next ask, and every question ships with quick-reply chips. [Pi](https://mobbin.com/flows/0c9c1310-01cc-4412-91ba-b0ed048b4f54) reflects ("Love that you're into design, such a creative world") before asking again; [Cleo](https://mobbin.com/screens/2c28f1dd-5d34-4aa8-ae74-3ebe71f7cc4f) delivers questions one at a time with amount chips ($145 / $229 / $170). [Alan's Mo](https://mobbin.com/screens/7f4dc1be-95b5-48e3-9935-6495806b55e4) writes the chips in the *user's* first-person voice ("Who are you, Mo?"), keeping the two-way fiction intact.

**Set the deal upfront and stage the payoff as an earned reveal.** [Speak](https://mobbin.com/screens/2ff2142a-53ef-4e63-acf0-24a0b8f137f1) names the character, scope and reward in one bubble ("a few quick questions to design the best curriculum for you") gated behind Start; [Cleo](https://mobbin.com/screens/0ded316e-868a-49c8-9a7e-8f372e868ddb) says "be honest in the next 5 qs, the more I know the better I can help you". Then [Tolan](https://mobbin.com/flows/f1595b35-4bcf-4abe-aeaf-ed5ff33f399b) gates the reading behind a "See your reading" button and [Finch](https://mobbin.com/screens/cff8f15a-488e-455b-973a-e1ce9e35193f) hands over a named notepad plan ("Sam Lee's starter plan"). The plan is a gift, not a dashboard that appears.

**Sync the character's entrance motion to its first words.** [Fable's Scout](https://mobbin.com/screens/de7a0c24-1cb0-43fc-b261-c5d679640e68) slides its bird up from the bottom exactly as the "I'm Scout" bubble lands; [Gentler Streak's Yorhart](https://mobbin.com/screens/54387efd-46b1-44aa-aebc-cbd0feb9651d) eases up into the scene; [Tolan](https://mobbin.com/screens/25e5429e-b3bf-4a36-bc14-20ced60ea33f) does a cinematic walk-on with lower-third captions. The body and the copy fire on the same beat.

**Let the user shape or interrogate the character.** [Copilot](https://mobbin.com/screens/ef2922b1-15ce-468e-b028-2ed58480b34f) lets you pick its voice; [Meta AI](https://mobbin.com/screens/2a75006f-547c-4a85-bebb-e61b06215321) lets you pick personality traits; [Alan](https://mobbin.com/screens/7f4dc1be-95b5-48e3-9935-6495806b55e4) and [Navigator](https://mobbin.com/screens/19222a30-e974-42c7-91f5-42aa72135baf) offer "Who are you?" chips so the persona reveal is *pull, not push*. Co-authorship manufactures ownership at near-zero build cost.

## 2. Why our chat intro isn't landing

The weak intro is a copy-and-choreography problem before it's an illustration problem, and our beat list shows exactly what's missing.

**Ryan is announced, not embodied.** Our flow spends two whole screens (FeaturePDP, then a "Meet Ryan" tap from home) *describing* that a character exists before he says anything in his own voice. That's the anti-pattern the research kills: Pi and Character.AI prove the persona by making the first chat bubble the personality. By the time Ryan actually speaks, we've already burned the reveal on a PDP card.

**The Byron takeover is doing the entrance work Ryan's intro should have done.** We stage a full centre-screen reveal + fly-into-app-bar moment for Byron, the *alter-ego*, while Ryan, the character the whole flow rests on, just appears in a chat. That's inverted. Byron is a persona *switch* and should be introduced the way [Stoic introduces Frida](https://mobbin.com/flows/f338c549-c18a-45db-81f1-12819c1eadfa) ("Frida is shaking things up") as a felt style-change, not out-glamour the protagonist's own arrival.

**No handshake, no name trade.** There's no beat where Ryan asks the user's name and reacts to it. [Finch](https://mobbin.com/flows/80ef83ef-f872-4825-b18d-6b193d60a9aa) trades vulnerability first ("if my name is Lee, what's your name?"); [Navigator](https://mobbin.com/screens/807dbf2c-f2f2-4730-8afd-4372c9baaecd) fires back "you're the first Jiho I've ever met". Without this, Ryan reads as a UI narrator, not a buddy.

**Questions are almost certainly firing bare.** The beats list "goal question" and "how much to save tier question" as discrete steps with no reflection between them. Every strong flow puts a reaction beat between asks ([Duolingo's](https://mobbin.com/flows/b0b4f93f-5637-46ec-9d77-49ecda6b991d) "since you know a few words…"). A goal-then-amount run with no echo in between is a form wearing Ryan's avatar.

**The contract is implicit.** We drop the user into "wrapped" recap + guess game and questions without Ryan ever saying how many questions there are or what they buy. Chat hides length, so it feels open-ended. Speak and Cleo both pre-sell "3 questions to a plan" so the user opts in.

**The plan reveal isn't credited to the conversation.** We have a "plan crunching" loader then "spending plan + category budgets", but nothing that says *based on what you told me* or carries the user's name/goal. [Wysa](https://mobbin.com/flows/acedbf77-df04-46ac-8935-ead41689925c) and [Finch](https://mobbin.com/screens/cff8f15a-488e-455b-973a-e1ce9e35193f) make the payoff visibly earned; ours risks reading as a generic dashboard.

## 3. Do this — character & questions

1. **Kill the "Meet Ryan" bio, let his first chat bubble be the intro.** Replace the FeaturePDP-then-meet-Ryan preamble with a straight cut into chat where message one *is* his personality: "hey, i'm ryan. your money buddy who's weirdly into helping you not go broke." Modelled on [Pi](https://mobbin.com/flows/0c9c1310-01cc-4412-91ba-b0ed048b4f54) / [Character.AI](https://mobbin.com/flows/c6596ed1-43af-4fed-afc9-a77a0571c2fc). *(beat: slice home to first chat, collapsing FeaturePDP + Meet Ryan)*

2. **Add a name-trade handshake as the first turn.** Before the wrapped recap, Ryan gives his name and asks for the user's, then echoes it with a cheeky line ("nice, anirudh, solid name for someone about to get rich"). Render the user's reply as a right-aligned sent bubble. Modelled on [Finch](https://mobbin.com/flows/80ef83ef-f872-4825-b18d-6b193d60a9aa) + [Navigator](https://mobbin.com/screens/807dbf2c-f2f2-4730-8afd-4372c9baaecd). *(beat: new, opens the chat)*

3. **State the contract before the questions.** One Ryan bubble gated behind a single "let's go" chip: "gonna ask you 3 quick things, then i'll build your plan. cool?" Turns the goal/amount/footprint run into a consented, countable deal. Modelled on [Cleo](https://mobbin.com/screens/0ded316e-868a-49c8-9a7e-8f372e868ddb) + [Speak](https://mobbin.com/screens/2ff2142a-53ef-4e63-acf0-24a0b8f137f1). *(beat: just before goal question)*

4. **Rewrite chips in the user's voice and add reflection beats.** The goal question posts back as a first-person sentence-completion. Ryan bubble "i want to help you…", chips "…save for a trip 🏝", "…stop running out before payday", "…build a cushion 🛟". After the answer, a reaction bubble before the next ask ("a trip? respect."). Ban bare question stacks. Modelled on [Headspace's](https://mobbin.com/flows/31b21791-dec6-448a-8253-648f5ebbba3e) "I want to…" + [Pi](https://mobbin.com/flows/0c9c1310-01cc-4412-91ba-b0ed048b4f54) + [Alan](https://mobbin.com/screens/7f4dc1be-95b5-48e3-9935-6495806b55e4). *(beats: goal question, how-much-to-save)*

5. **Give save-amount its own calm beat with chips, not a bare field.** ₹1k / ₹3k / ₹5k / other, one dominant control, everything else off-screen, Ryan reacting live to the figure ("₹3k a month, doable"). Modelled on [Fabulous](https://mobbin.com/flows/060e3fc0-5785-4ef6-9dc2-dd257a652797) + [Cleo](https://mobbin.com/screens/2c28f1dd-5d34-4aa8-ae74-3ebe71f7cc4f). *(beat: how-much-to-save tier)*

6. **Frame bank-linking as an in-character trust ask and narrate the wait.** Ryan asks for access in his voice ("you tell me the goal, i watch your money so you don't have to, mind linking up?"), and the connect loader is Ryan narrating ("pulling your accounts now, takes a sec ⏳") with a top-pinned "✅ linked" toast, not a hard cut to a system screen. Modelled on [Gentler Streak](https://mobbin.com/screens/54387efd-46b1-44aa-aebc-cbd0feb9651d) + [Cleo](https://mobbin.com/flows/78850b24-4ac4-4c5a-ae91-89014abd6d4d). *(beats: AA-intro card, connect loader)*

7. **Turn the guess game into a performed cold-read that pays off at the plan.** Before the reveal, Ryan does a cheeky read of the user from their answers ("goal-oriented, a little impatient, wants results yesterday, close? 😏"), then names them a light saver-archetype in the plan ("you're a slow-and-steady saver"). Modelled on [Dot](https://mobbin.com/screens/77e8b18e-9982-4f47-80eb-25834ac75c7b) + [Headspace's](https://mobbin.com/flows/31b21791-dec6-448a-8253-648f5ebbba3e) "Calm Explorers like you". *(beats: wrapped guess game, verdict)*

8. **Make the plan a named artifact credited to the conversation.** Precede it with "okay, based on what you told me…", render the plan on a distinct card (passbook / receipt surface in DLS) titled "anirudh's plan" with the stated goal baked in, Ryan on-screen reacting. Modelled on [Finch](https://mobbin.com/screens/cff8f15a-488e-455b-973a-e1ce9e35193f) + [Wysa](https://mobbin.com/flows/acedbf77-df04-46ac-8935-ead41689925c). *(beats: spending plan, safe-to-spend reveal)*

## 4. Do this — animation/motion

1. **Fragment Ryan's arrival into staggered typing-in bubbles.** Replace any single intro bubble with "hey 👋" / "i'm ryan, your money buddy" / "what should i call you?" ~500-700ms apart, a typing-dots bubble before each. This is the single biggest, cheapest fix for the "lame animation" flag: the motion is the arrival rhythm. Modelled on [Navigator](https://mobbin.com/screens/807dbf2c-f2f2-4730-8afd-4372c9baaecd) + [Wysa](https://mobbin.com/flows/acedbf77-df04-46ac-8935-ead41689925c). *(beat: first chat)*

2. **Sync Ryan's body entrance to his first words + add a pre-chat beat.** Slide his illustration up from the bottom exactly as the "i'm ryan" bubble lands; before that, hold a ~1.2s beat of the slice mark or the user's name on a purple canvas so his arrival feels staged, not instant. Modelled on [Fable](https://mobbin.com/screens/de7a0c24-1cb0-43fc-b261-c5d679640e68) + [Pi](https://mobbin.com/screens/510ce76f-15e2-4d5e-9551-22e6e36c45a4). *(beat: slice home to first chat)*

3. **Keep Ryan mounted and cross-fade only the bubble + chips between questions.** No full-screen teardown per question; pin his avatar and animate just the new bubble and answer chips in, with a thin top progress bar so the interview reads as finite. Add a small idle loop (blink/bob) + contact shadow so he's alive between turns, not a static PNG. Modelled on [Duolingo](https://mobbin.com/flows/7d7aacbe-213b-471e-8b1f-b5b7087bcb65) + [Speak](https://mobbin.com/screens/1f67e3ca-3f06-4805-8d0a-a80ea1f0b93a) + [Wysa](https://mobbin.com/screens/c04f5bad-c60e-42d2-a4aa-14839ddafddb). *(beats: goal, how-much-to-save, footprint, budget confirm)*

4. **Make "plan crunching" a scripted anticipation beat, not a spinner.** Ryan with a thinking animation and self-typing status bubbles that check off ("crunching your spends ✓", "finding safe-to-save ✓"), a natural spot for a Byron aside. Modelled on [Fabulous](https://mobbin.com/flows/060e3fc0-5785-4ef6-9dc2-dd257a652797) "finalizing your personalized journey". *(beat: plan crunching)*

5. **Sequence the reveal as a climax: tick-draw to number count-up to Ryan reaction.** On the safe-to-spend / plan reveal, animate a stroke-drawing check, count the monthly amount up, then Ryan drops a one-shot hop + reaction bubble ("boom. ₹X/month, you hit your goal by [date] 🔥"). Modelled on [Vivid](https://mobbin.com/screens/095e21f4-b72e-48a9-9677-078d4c01e1b5) + [Speak](https://mobbin.com/screens/1f67e3ca-3f06-4805-8d0a-a80ea1f0b93a). *(beats: spending plan, safe-to-spend reveal)*

6. **Re-scope the Byron takeover as a felt style-switch, not a bigger entrance than Ryan's.** Keep the fly-into-app-bar, but earn it: announce the switch the way Stoic announces Frida, and make Byron's bubbles a visibly different tint/badge so the persona flip is *felt* through styling, not a separate hero screen that upstages Ryan. Ideally introduce him via a "want me chill, or a bit cheeky?" toggle earlier so the takeover confirms a choice the user made. Modelled on [Stoic/Frida](https://mobbin.com/flows/f338c549-c18a-45db-81f1-12819c1eadfa) + [Cleo's badge swap](https://mobbin.com/screens/2c28f1dd-5d34-4aa8-ae74-3ebe71f7cc4f) + [Copilot](https://mobbin.com/screens/ef2922b1-15ce-468e-b028-2ed58480b34f). *(beat: Meet Byron takeover)*

## 5. Cut / avoid

- **Cut the FeaturePDP + separate "Meet Ryan" preamble.** Announcing a character before he speaks is the exact weakness the research flags. His first bubble should be the intro. Two describe-the-character screens is one too many, plus one.
- **Don't let Byron's reveal be more cinematic than Ryan's.** An alter-ego out-entrancing the protagonist confuses who the buddy is. Byron is a style-switch beat, not a second hero.
- **No bare question stacks and no bare input fields.** Goal-then-amount with no reflection between = a form. Every question needs a chip set (with an honest escape hatch like "not sure yet 🤷") and a reaction beat after the answer.
- **Don't dump multi-bubble sequences instantly.** Without typing-dot delays the pacing reads dead; that *is* the "lame animation". Never stack two asks (goal + amount) in one turn.
- **Don't hard-cut to a system screen for bank-linking or sync.** It breaks the chat surface. Keep it in-thread as a toast + Ryan narration.
- **Don't reveal the plan as an uncredited dashboard.** No "based on what you told me" + no name/goal echo means the questions feel wasted. Reserve free-text/voice input only for the emotional "what are you saving for", everything structured stays chips/sheets so the user barely types.

Full brief also written to `/private/tmp/claude-502/-Users-anirudhbhat-claude/eb18c01b-7dbc-4e4d-a051-11a2556ced00/scratchpad/ryan-brief.md`.
