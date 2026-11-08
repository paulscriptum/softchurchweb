import type { Thesis } from './types';

export const manifesto = {
  label: 'soft.church · statement 000',
  lead: 'a quiet house for given things.',
  identity:
    'soft.church is an independent artistic project. some religious references are rooted in personal christian faith. it is not a religious institution, but a space for exploring creativity, attention, and the beauty of creation.',
  theses: [
    {
      number: 0,
      title: 'everything is given.',
      body: "we didn't make the light. we didn't make the sound. we didn't make the hands. we only arrange what was handed to us. gratitude is the first material.",
      reference: 'james 1:17',
      verse:
        'every good gift and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shadow of turning.',
    },
    {
      number: 1,
      title: 'God is everywhere.',
      body: 'a field and a feed. a stone, a sound, a forgotten page. none of these is outside his presence. we keep the traces, in pixels and in matter.',
      reference: 'psalm 120:1–2 (121:1–2)',
      verse:
        'i will lift up mine eyes unto the hills, from whence cometh my help. my help cometh from the Lord, which made heaven and earth.',
    },
    {
      number: 2,
      title: 'an artifact is a witness.',
      body: 'every object here is proof that something happened to someone. what we pass on is evidence.',
      reference: 'isaiah 30:8',
      verse:
        'go, write it before them on a tablet, and inscribe it in a book, that it may be for the time to come as a witness forever.',
    },
    {
      number: 3,
      title: 'some things fall from the sky.',
      body: "every seventh day we freely give something to the world. this is not a promotion. grace can't be owned. it can only be received.",
    },
    {
      number: 4,
      title: 'some things must be kept.',
      body: 'others exist in small numbers. one, three, twelve, thirty-three, three hundred thirty-three. a chosen limit. fewer keepers, heavier trust.',
    },
    {
      number: 5,
      title: 'quiet is the signal.',
      body: "soft light. white space. slow sound. we don't shout. if you found us, you were already looking.",
      reference: '3 kingdoms 19:12 (1 kings 19:12)',
      verse: 'and after the earthquake a fire; but the Lord was not in the fire: and after the fire the voice of a gentle breeze.',
    },
    {
      number: 6,
      title: 'we speak our own language.',
      body: 'brands wore the old words out. so we made new ones. the words arrive with the objects.',
    },
    {
      number: 7,
      title: 'made with friends.',
      body: 'artists, musicians, people who write code at night. every guest brings a world. this is a shared house.',
    },
    {
      number: 8,
      title: 'a tool can be quiet.',
      body: 'a small piece of software can hold attention, like a candle. we make instruments for listening, waiting, wondering.',
    },
    {
      number: 9,
      title: 'everything ends.',
      body: 'volume i. thirty-three objects. one every seventh day. then the doors close. volume ii may open later. the ending is what gives each artifact its weight.',
      reference: 'ecclesiastes 3:1',
      verse: 'to every thing there is a season, and a time to every purpose under the heaven.',
    },
    {
      number: 10,
      title: 'be still.',
      body: 'the world is loud and always in a hurry. we are not. nothing here asks you to rush, to scroll faster or to want more. stop for a moment. look. listen. that is all we ask of you.',
      reference: 'psalm 45:11 (46:10)',
      verse: 'be still, and know that i am God.',
    },
  ] satisfies Thesis[],
  closing: ['333'],
  referencesNote: 'first number: orthodox bible. in brackets: western bibles.',
};
