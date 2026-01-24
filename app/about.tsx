import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import ReactMarkdown from 'react-markdown';
import { PageHeader } from '../src/components/PageHeader';

const readmeContent = `# Runestone Safari

_Version 2.1_

[https://runestonesafari.com/](https://runestonesafari.com/)

Runestone Safari is an interactive map application that allows you to explore Swedish runestones.

## Features

- Interactive clustering map with 6,815+ runestones
- Offline caching of runestones
- Search for runestones by name, location, or other attributes
- Detailed information about each runestone
- User authentication (not required)
- User profile page
- List of visited runestones
- Ability to mark visited runestones (if you have account)

## Data Sources

- [OpenFreeMap](https://openfreemap.org/) for map tiles
- [Samnordisk Runtextdatabas](https://www.uu.se/institution/nordiska/forskning/projekt/samnordisk-runtextdatabas) for runestone data
- Original SQLite database from [Rundata-net](https://www.rundata.info/)

## Acknowledgments

- [Vadim Frolov](https://github.com/fralik) and Sofia Pereswetoff-Morath for [runes.sqlite3](https://github.com/fralik/rundata-net/blob/master/rundatanet/static/runes/runes.sqlite3)

## License

Copyright (C) 2025-2026 Denis Filonov

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
`;

export default function About() {
  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'About' }} />
      <PageHeader title="About" />

      <View className="md:p-8 lg:p-12">
        <View className="md:max-w-5xl md:mx-auto w-full bg-white md:rounded-lg md:shadow-sm md:border md:border-gray-100 overflow-hidden">
          <View className="p-4 md:p-8">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <Text className="text-3xl font-bold text-primary mb-6">{children}</Text>
                ),
                h2: ({ children }) => (
                  <Text className="text-xl font-semibold text-primary mt-8 mb-4">{children}</Text>
                ),
                p: ({ children }) => (
                  <Text className="text-base text-gray-700 mb-4 leading-6">{children}</Text>
                ),
                ul: ({ children }) => <View className="mb-4 ml-4">{children}</View>,
                li: ({ children }) => (
                  <View className="flex-row items-start mb-2">
                    <Text className="text-primary mr-2">•</Text>
                    <Text className="flex-1 text-gray-700">{children}</Text>
                  </View>
                ),
                strong: ({ children }) => <Text className="font-bold">{children}</Text>,
                em: ({ children }) => <Text className="italic">{children}</Text>,
                a: ({ children }) => <Text className="text-primary underline">{children}</Text>,
                code: ({ children }) => (
                  <View className="bg-gray-100 rounded p-4 my-4">
                    <Text className="text-sm font-mono text-gray-800">{children}</Text>
                  </View>
                ),
              }}
            >
              {readmeContent}
            </ReactMarkdown>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
