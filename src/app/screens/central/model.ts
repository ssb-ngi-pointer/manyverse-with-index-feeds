/**
 * MMMMM is a mobile app for Secure Scuttlebutt networks
 *
 * Copyright (C) 2017 Andre 'Staltz' Medeiros
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import xs, {Stream} from 'xstream';
import {Reducer, Lens} from 'cycle-onionify';
import {FeedId} from 'ssb-typescript';
import {State as PublicTabState} from './public-tab/model';
import {SSBSource} from '../../drivers/ssb';

export type State = {
  selfFeedId: FeedId;
  currentTab: number;
  publicTab?: PublicTabState;
  numOfPublicUpdates: number;
};

export function initState(selfFeedId: FeedId): State {
  return {
    selfFeedId,
    currentTab: 0,
    numOfPublicUpdates: 0,
  };
}

export const publicTabLens: Lens<State, PublicTabState> = {
  get: (parent: State): PublicTabState => {
    if (parent.publicTab) {
      return {...parent.publicTab, selfFeedId: parent.selfFeedId};
    } else {
      return {
        selfFeedId: parent.selfFeedId,
        getPublicFeedReadable: null,
        getSelfRootsReadable: null,
        numOfUpdates: parent.numOfPublicUpdates,
      };
    }
  },

  set: (parent: State, child: PublicTabState): State => {
    return {
      ...parent,
      numOfPublicUpdates: child.numOfUpdates,
      publicTab: child,
    };
  },
};

export type Actions = {
  changeTab$: Stream<number>;
};

export default function model(
  actions: Actions,
  ssbSource: SSBSource,
): Stream<Reducer<State>> {
  const initReducer$ = xs.of(function initReducer(prev?: State): State {
    if (prev) {
      return prev;
    } else {
      return {
        selfFeedId: '',
        currentTab: 0,
        numOfPublicUpdates: 0,
      };
    }
  });

  const setSelfFeedId$ = ssbSource.selfFeedId$.map(
    selfFeedId =>
      function setSelfFeedId(prev: State): State {
        return {...prev, selfFeedId};
      },
  );

  const changeTabReducer$ = actions.changeTab$.map(
    i =>
      function changeTabReducer(prev: State): State {
        return {...prev, currentTab: i};
      },
  );

  return xs.merge(initReducer$, setSelfFeedId$, changeTabReducer$);
}
