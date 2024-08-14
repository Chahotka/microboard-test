import songsData from '../data/songs2.json';
import { Song } from '../interfaces/SongInterface';
import { CompareObject } from '../interfaces/CompareObjectInterface';


export const useJaccard = (
  setSimArr: React.Dispatch<React.SetStateAction<{similarity: number, song: Song}[]>>
) => {
  const songs: Song[] = JSON.parse(JSON.stringify(songsData));

  const compareToSong = (song: Song) => {
    const similarityArr = [];
    const songA = createCompareObject(song);

    for (let i = 0; i < songs.length; i++) {
      if (songA['Track'] === songs[i]['Track']) continue;

      const songB = createCompareObject(songs[i]);
      const similarity = jaccard(songA, songB);

      
      similarityArr.push({
        similarity, 
        song: songs[i],
      });
    }

    const sortedArr = similarityArr.sort((a, b) => a.similarity - b.similarity)

    setSimArr(sortedArr)
  };

  const jaccard = (songA: CompareObject, songB: CompareObject): number => {
    if (!songB['Artist']) return 0;

    let intersectSize: number = 0;
    let checkCount: number = Object.keys(songA).length + Object.keys(songB).length;

    intersectSize += checkTrack(songA, songB)
    intersectSize += checkScore(songA, songB)
    intersectSize += checkStreamComparison(songA, songB);
    intersectSize += songA['Artist'] === songB['Artist'] ? 2.5 : 0;
    intersectSize += songA['Album Name'] === songB['Album Name'] ? 1.5 : 0;
    intersectSize += songA['Explicit Track'] === songB['Explicit Track'] ? 1 : 0
    intersectSize += Math.abs(Number(songA['Release Date']) - Number(songB['Release Date'])) <= 2 ? 1.5 : 0

    return intersectSize / ((checkCount) - intersectSize);
  };

  const createCompareObject = (song: Song) => {
    const streamReg = /,/g;

    const overallStreams = 
      Number(song['Spotify Streams'].toString().replace(streamReg, '')) || 0 +
      Number(song['Pandora Streams'].toString().replace(streamReg, '')) || 0 +
      Number(song['Soundcloud Streams'].toString().replace(streamReg, '')) || 0

    const releaseReg = /[0-9]+\//g;
    const releaseYear = song['Release Date'].replace(releaseReg, '');
    
    const songObj: CompareObject = {
      "Score": song['Track Score'],
      "Track": song['Track'],
      "Artist": song['Artist'],
      "Album Name": song['Album Name'],
      "Release Date": releaseYear,
      "Overall Streams": overallStreams,
      "Explicit Track": song['Explicit Track']
    };

    return songObj;
  };

  const checkTrack = (songA: CompareObject, songB: CompareObject) => {
    let similarities = 0;
    const aTrack = songA['Track'].toString().toLowerCase();
    const bTrack = songB['Track'].toString().toLowerCase();
    const aArtist = songA['Artist'].toString().toLowerCase();
    const bArtist = songB['Artist'].toString().toLowerCase();
    
    if (
      aTrack.toLowerCase().includes(bArtist.toLowerCase()) ||
      bTrack.toLowerCase().includes(aArtist.toLowerCase())
    ) {
      similarities += 1.5;
    }

    const aArr = aTrack.split(' ');
    const bArr = bTrack.split(' ');

    let nameIntersect = aArr.length > bArr.length
      ? aArr.filter(el => bArr.includes(el)).length
      : bArr.filter(el => aArr.includes(el)).length;

    if (nameIntersect === 1) similarities += 0.5;
    if (nameIntersect > 1) similarities++;

    similarities > 1.5 && console.log(songA, songB)

    return similarities
  }

  const checkScore = (songA: CompareObject, songB: CompareObject): number => {
    let difference = 0;
    const aScore = songA['Score'];
    const bScore = songB['Score'];

    if (aScore > bScore) {
      difference = (aScore - bScore) * 100 / aScore
    } else {
      difference = (bScore - aScore) * 100 / bScore
    }

    return difference <= 40 ? 1 : 0
  }

  const checkStreamComparison = (songA: CompareObject, songB: CompareObject): number => {
    let difference = 0;
    const aStreams = songA['Overall Streams'];
    const bStreams = songB['Overall Streams'];

    if (aStreams > bStreams) {
      difference = (aStreams - bStreams) * 100 / aStreams;
    } else {
      difference = (bStreams - aStreams) * 100 / bStreams;
    }

    return difference <= 40 ? 1 : 0;
  }

  return { songs, compareToSong }
}