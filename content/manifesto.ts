import type { Thesis } from './types';

export const manifesto = {
  label: 'soft.church · statement 000',
  lead: 'a quiet house for given things.',
  theses: [
    {
      number: 0,
      title: 'everything is given.',
      body: "we didn't make the light. we didn't make the sound. we didn't make the hands. we only arrange what was handed to us. gratitude is the first material.",
      reference: 'james 1:17',
    },
    {
      number: 1,
      title: 'God is everywhere.',
      body: 'in a field and in a feed. in a stone, a sound, a forgotten page. there is no online or offline for God. we keep the traces, in pixels and in matter.',
      reference: 'psalm 138:8 (139:8)',
    },
    {
      number: 2,
      title: 'an artifact is a witness.',
      body: "every object here is proof that something happened to someone. we don't sell things. we pass on evidence.",
      reference: 'joshua 24:27',
    },
    {
      number: 3,
      title: 'some things fall from the sky.',
      body: "every seventh day something is free. this is not a promotion. grace can't be owned. it can only be received.",
      reference: 'matthew 10:8',
    },
    {
      number: 4,
      title: 'some things must be kept.',
      body: 'others exist in small numbers. one, three, twelve, thirty-three, three hundred thirty-three. the number is part of the meaning. fewer keepers, heavier trust.',
      reference: 'luke 2:19',
    },
    {
      number: 5,
      title: 'quiet is the signal.',
      body: "soft light. white space. slow sound. we don't shout. if you found us, you were already looking.",
      reference: '3 kingdoms 19:12 (1 kings 19:12)',
    },
    {
      number: 6,
      title: 'we speak our own language.',
      body: 'brands wore the old words out. so we made new ones. the words arrive with the objects.',
      reference: 'revelation 21:5',
    },
    {
      number: 7,
      title: 'made with friends.',
      body: 'artists, musicians, people who write code at night. every guest brings a world. this is a shared house.',
      reference: 'matthew 18:20',
    },
    {
      number: 8,
      title: 'a tool can be a prayer.',
      body: 'a small piece of software can hold attention like a candle. we make instruments for listening, waiting, wondering.',
      reference: 'psalm 140:2 (141:2)',
    },
    {
      number: 9,
      title: 'everything ends.',
      body: 'volume i. thirty-three objects. one every seventh day. then the doors close. volume ii may open later. the ending is what gives each artifact its weight.',
      reference: 'ecclesiastes 3:1',
    },
    {
      number: 10,
      title: 'be still.',
      body: 'the world is loud and always in a hurry. we are not. nothing here asks you to rush, to scroll faster or to want more. stop for a moment. look. listen. that is all we ask of you.',
      reference: 'psalm 45:11 (46:10)',
    },
  ] satisfies Thesis[],
  closing: ['amen.', '333'],
  referencesNote: 'first number: orthodox bible. in brackets: western bibles.',
};
